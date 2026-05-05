<?php

namespace App\Controller;

use App\Entity\Title;
use App\Repository\GenreRepository;
use App\Repository\TitleRepository;
use App\Service\AuthService;
use App\Service\DataService;
use App\Service\SerializerService;
use App\Service\TitleService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/titles')]
class TitleController extends AbstractController
{
    public function __construct(
        private TitleRepository $titleRepository,
        private GenreRepository $genreRepository,
        private DataService $dataService,
        private AuthService $authService,
        private TitleService $titleService,
        private SerializerService $serializer,
    ) {}


    #[Route('', methods: ['GET'])]
    public function index(Request $request): JsonResponse
    {
        $user = $this->authService->getAuthenticatedUser($request);
        $titles = $this->dataService->findBy(Title::class, ['user' => $user]);

        return $this->json(array_map(
            fn(Title $title) => $this->serializer->serializeTitle($title, $user),
            $titles
        ));
    }

    #[Route('/discovery', methods: ['GET'])]
    public function discovery(Request $request): JsonResponse
    {
        $user = $this->authService->getAuthenticatedUser($request);
        $allTitles = $this->dataService->findAll(Title::class, ['name' => 'ASC', 'id' => 'ASC']);
        $userTitles = $this->dataService->findBy(Title::class, ['user' => $user]);

        $userTitleKeys = array_fill_keys(
            array_map(fn(Title $title) => $this->titleService->getTitleKey($title), $userTitles),
            true
        );

        $grouped = [];
        foreach ($allTitles as $title) {
            $key = $this->titleService->getTitleKey($title);
            if (!isset($grouped[$key])) {
                $grouped[$key] = [
                    'representative' => $title,
                    'instances' => [],
                    'publicInstances' => [],
                ];
            }
            $grouped[$key]['instances'][] = $title;
            if ($title->isPublic()) {
                $grouped[$key]['publicInstances'][] = $title;
                if (!$grouped[$key]['representative']->isPublic()) {
                    $grouped[$key]['representative'] = $title;
                }
            }
        }

        $result = [];
        foreach ($grouped as $key => $data) {
            if (count($data['publicInstances']) === 0) {
                continue;
            }

            $representative = $data['representative'];
            $stats = $this->titleService->aggregateCommentStats($data['instances']);

            $result[] = array_merge(
                $this->serializer->serializeTitle($representative, $user, $stats),
                [
                    'instanceCount' => count($data['instances']),
                    'alreadyAdded' => isset($userTitleKeys[$key])
                ]
            );
        }

        return $this->json($result);
    }

    #[Route('/{id}', methods: ['GET'])]
    public function show(Title $title, Request $request): JsonResponse
    {
        $user = $this->authService->getAuthenticatedUser($request);
        $matchingTitles = $this->titleService->getMatchingTitles($title);
        $stats = $this->titleService->aggregateCommentStats($matchingTitles);

        return $this->json(array_merge(
            $this->serializer->serializeTitle($title, $user, $stats),
            [
                'instanceCount' => count($matchingTitles),
            ]
        ));
    }

    #[Route('', methods: ['POST'])]
    public function create(Request $request): JsonResponse
    {
        $user = $this->authService->getAuthenticatedUser($request);
        $contentType = $request->getContentTypeFormat();
        if ($contentType === 'form') {
            $body = $request->request->all();
            if (!isset($body['genres'])) {
                $body['genres'] = [];
            }
        } else {
            $body = json_decode($request->getContent(), true) ?? [];
        }

        if (empty($body['name'])) {
            return $this->json(['error' => 'Naam is verplicht'], 400);
        }

        if (!in_array($body['type'] ?? '', ['film', 'serie'])) {
            return $this->json(['error' => 'Type moet film of serie zijn'], 400);
        }

        if (isset($body['year']) && !is_numeric($body['year'])) {
            return $this->json(['error' => 'Jaartal moet een getal zijn'], 400);
        }

        $existingTitles = $this->dataService->findBy(Title::class, ['user' => $user]);
        foreach ($existingTitles as $existing) {
            if ($this->titleService->getTitleKey($existing) === $this->titleService->getTitleKey($this->titleService->createTitleFromData($body))) {
                return $this->json(['error' => 'Dit item zit al in je collectie'], 400);
            }
        }

        $title = new Title();
        $title->setName($body['name']);
        $title->setType($body['type']);
        $title->setYear(isset($body['year']) && $body['year'] ? (int)$body['year'] : null);
        $title->setWatched((bool)(isset($body['watched']) ? $body['watched'] : false));
        $title->setPublic((bool)(isset($body['public']) ? $body['public'] : false));
        $title->setFavorite((bool)(isset($body['favorite']) ? $body['favorite'] : false));
        $title->setUser($user);

        foreach ($body['genres'] ?? [] as $genreId) {
            $genre = $this->genreRepository->find($genreId);
            if ($genre) {
                $title->addGenre($genre);
            }
        }

        $uploadsDir = $this->getParameter('kernel.project_dir') . '/public/uploads/titles';
        if (!is_dir($uploadsDir)) {
            @mkdir($uploadsDir, 0755, true);
        }

        $thumbFile = $request->files->get('thumbnail');
        if ($thumbFile) {
            $thumbName = $this->titleService->buildUploadFilename($thumbFile, 'thumb_');
            $thumbFile->move($uploadsDir, $thumbName);
            $title->setThumbnail($thumbName);
        }

        $this->dataService->persistAndFlush($title);

        return $this->json($this->serializer->serializeTitle($title, $user), 201);
    }

    #[Route('/{id}', methods: ['PATCH'])]
    public function update(Title $title, Request $request): JsonResponse
    {
        $user = $this->authService->getAuthenticatedUser($request);

        if ($title->getUser() !== $user) {
            return $this->json(['error' => 'Niet gevonden'], 404);
        }

        $contentType = $request->getContentTypeFormat();
        if ($contentType === 'form') {
            $body = $request->request->all();
            if (!isset($body['genres'])) {
                $body['genres'] = [];
            }
        } else {
            $body = json_decode($request->getContent(), true) ?? [];
        }

        if (isset($body['name'])) {
            if (empty($body['name'])) {
                return $this->json(['error' => 'Naam mag niet leeg zijn'], 400);
            }
            $title->setName($body['name']);
        }

        if (isset($body['type'])) {
            if (!in_array($body['type'], ['film', 'serie'])) {
                return $this->json(['error' => 'Type moet film of serie zijn'], 400);
            }
            $title->setType($body['type']);
        }

        if (array_key_exists('year', $body)) {
            $title->setYear($body['year'] ? (int)$body['year'] : null);
        }

        if (isset($body['watched'])) {
            $title->setWatched($body['watched'] === '1' || $body['watched'] === 1 || $body['watched'] === true);
        }

        if (array_key_exists('rating', $body)) {
            $title->setRating($body['rating'] ? (int)$body['rating'] : null);
        }

        if (isset($body['public'])) {
            $title->setPublic($body['public'] === '1' || $body['public'] === 1 || $body['public'] === true);
        }

        if (isset($body['favorite'])) {
            $title->setFavorite($body['favorite'] === '1' || $body['favorite'] === 1 || $body['favorite'] === true);
        }

        if (array_key_exists('genres', $body)) {
            foreach ($title->getGenres() as $genre) {
                $title->removeGenre($genre);
            }
            foreach ($body['genres'] as $genreId) {
                $genre = $this->genreRepository->find($genreId);
                if ($genre) {
                    $title->addGenre($genre);
                }
            }
        }

        $uploadsDir = $this->getParameter('kernel.project_dir') . '/public/uploads/titles';
        if (!is_dir($uploadsDir)) {
            @mkdir($uploadsDir, 0755, true);
        }

        $thumbFile = $request->files->get('thumbnail');
        if ($thumbFile) {
            $thumbName = $this->titleService->buildUploadFilename($thumbFile, 'thumb_');
            $thumbFile->move($uploadsDir, $thumbName);
            $title->setThumbnail($thumbName);
        }

        $this->dataService->flush();

        return $this->json($this->serializer->serializeTitle($title, $user));
    }

    #[Route('/{id}', methods: ['DELETE'])]
    public function delete(Title $title, Request $request): JsonResponse
    {
        $user = $this->authService->getAuthenticatedUser($request);

        if ($title->getUser() !== $user) {
            return $this->json(['error' => 'Niet gevonden'], 404);
        }

        $this->dataService->removeAndFlush($title);

        return $this->json(null, 204);
    }
}
