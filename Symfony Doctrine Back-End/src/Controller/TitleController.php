<?php

namespace App\Controller;

use App\Entity\Title;
use App\Repository\GenreRepository;
use App\Repository\TitleRepository;
use App\Service\AuthService;
use App\Service\DataService;
use App\Service\FileUploadService;
use App\Service\SerializerService;
use App\Service\TitleService;
use InvalidArgumentException;
use RuntimeException;
use Symfony\Component\HttpFoundation\File\UploadedFile;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/titles')]
class TitleController extends ApiController
{
    public function __construct(
        private TitleRepository $titleRepository,
        private GenreRepository $genreRepository,
        private DataService $dataService,
        private AuthService $authService,
        private TitleService $titleService,
        private FileUploadService $fileUploadService,
        private SerializerService $serializer,
    ) {}

    #[Route('', methods: ['GET'])]
    public function index(Request $request): JsonResponse
    {
        $user = $this->authService->requireAuthenticatedUser($request);

        $search = $request->query->get('search');
        $type = $request->query->get('type');
        $watched = $request->query->get('watched');

        $titles = $this->titleRepository->findByUserWithFilters($user, $search, $type, $watched);

        return $this->json(array_map(
            fn(Title $title) => $this->serializer->serializeTitle($title, $user),
            $titles
        ));
    }

    #[Route('/{id}', methods: ['GET'])]
    public function show(Title $title, Request $request): JsonResponse
    {
        $user = $this->authService->requireAuthenticatedUser($request);

        if ($title->getUser() !== $user) {
            return $this->json(['error' => 'Niet gevonden'], 404);
        }

        $matchingTitles = $this->titleService->getMatchingTitles($title);

        return $this->json(array_merge(
            $this->serializer->serializeTitle($title, $user),
            [
                'instanceCount' => count($matchingTitles),
            ]
        ));
    }

    #[Route('', methods: ['POST'])]
    public function create(Request $request): JsonResponse
    {
        $user = $this->authService->requireAuthenticatedUser($request);

        $body = $this->requestBody($request);
        if ($body instanceof JsonResponse) {
            return $body;
        }

        $name = $this->titleService->normalizeName($body['name'] ?? null);
        if ($name === null) {
            return $this->badRequest('Naam is verplicht');
        }

        $type = $this->titleService->normalizeType($body['type'] ?? null);
        if ($type === null) {
            return $this->badRequest('Type moet film of serie zijn');
        }

        if (!array_key_exists('year', $body) || $body['year'] === null || $body['year'] === '') {
            return $this->badRequest('Jaartal is verplicht');
        }

        if (!$this->titleService->isValidYear($body['year'])) {
            return $this->badRequest('Voer een geldig jaartal in');
        }

        $genreIds = $this->titleService->normalizeGenreIds($body['genres'] ?? []);
        if ($genreIds === null) {
            return $this->badRequest('Genres moeten geldige ids zijn');
        }

        if (count($genreIds) === 0) {
            return $this->badRequest('Kies minimaal één genre');
        }

        $body['name'] = $name;
        $body['type'] = $type;
        $body['year'] = $this->titleService->normalizeYear($body['year']);

        $titleKey = $this->titleService->getTitleKeyFromData($body);
        $existingTitles = $this->dataService->findBy(Title::class, ['user' => $user]);

        foreach ($existingTitles as $existing) {
            if ($this->titleService->getTitleKey($existing) === $titleKey) {
                return $this->badRequest('Dit item zit al in je collectie');
            }
        }

        $title = new Title();
        $title->setName($name);
        $title->setType($type);
        $title->setYear($body['year']);
        $title->setWatched($this->titleService->normalizeBoolean($body['watched'] ?? false));
        $title->setFavorite($this->titleService->normalizeBoolean($body['favorite'] ?? false));
        $title->setUser($user);

        foreach ($genreIds as $genreId) {
            $genre = $this->genreRepository->find($genreId);

            if ($genre) {
                $title->addGenre($genre);
            }
        }

        if (count($title->getGenres()) === 0) {
            return $this->badRequest('Kies minimaal één bestaand genre');
        }

        $uploadError = $this->applyThumbnailChanges($title, $request, $body);
        if ($uploadError) {
            return $uploadError;
        }

        $this->dataService->persistAndFlush($title);

        return $this->json($this->serializer->serializeTitle($title, $user), 201);
    }

    #[Route('/{id}', methods: ['PATCH'])]
    public function update(Title $title, Request $request): JsonResponse
    {
        $user = $this->authService->requireAuthenticatedUser($request);

        if ($title->getUser() !== $user) {
            return $this->json(['error' => 'Niet gevonden'], 404);
        }

        $body = $this->requestBody($request);
        if ($body instanceof JsonResponse) {
            return $body;
        }

        if (array_key_exists('name', $body)) {
            $name = $this->titleService->normalizeName($body['name']);

            if ($name === null) {
                return $this->badRequest('Naam is verplicht');
            }

            $title->setName($name);
        }

        if (array_key_exists('type', $body)) {
            $type = $this->titleService->normalizeType($body['type']);

            if ($type === null) {
                return $this->badRequest('Type moet film of serie zijn');
            }

            $title->setType($type);
        }

        if (array_key_exists('year', $body)) {
            if ($body['year'] === null || $body['year'] === '') {
                return $this->badRequest('Jaartal is verplicht');
            }

            if (!$this->titleService->isValidYear($body['year'])) {
                return $this->badRequest('Voer een geldig jaartal in');
            }

            $title->setYear($this->titleService->normalizeYear($body['year']));
        }

        if (array_key_exists('watched', $body)) {
            $title->setWatched($this->titleService->normalizeBoolean($body['watched']));
        }

        if (array_key_exists('favorite', $body)) {
            $title->setFavorite($this->titleService->normalizeBoolean($body['favorite']));
        }
    
        if (array_key_exists('genres', $body)) {
            $genreIds = $this->titleService->normalizeGenreIds($body['genres']);

            if ($genreIds === null) {
                return $this->badRequest('Genres moeten geldige ids zijn');
            }

            if (count($genreIds) === 0) {
                return $this->badRequest(json_encode($body));
            }

            foreach ($title->getGenres() as $genre) {
                $title->removeGenre($genre);
            }

            foreach ($genreIds as $genreId) {
                $genre = $this->genreRepository->find($genreId);

                if ($genre) {
                    $title->addGenre($genre);
                }
            }

            if (count($title->getGenres()) === 0) {
                return $this->badRequest('Kies minimaal één bestaand genre');
            }
        }

        $uploadError = $this->applyThumbnailChanges($title, $request, $body);
        if ($uploadError) {
            return $uploadError;
        }

        $this->dataService->flush();

        return $this->json($this->serializer->serializeTitle($title, $user));
    }

    #[Route('/{id}', methods: ['DELETE'])]
    public function delete(Title $title, Request $request): JsonResponse
    {
        $user = $this->authService->requireAuthenticatedUser($request);

        if ($title->getUser() !== $user) {
            return $this->json(['error' => 'Niet gevonden'], 404);
        }

        if ($title->getThumbnail()) {
            try {
                $this->fileUploadService->deleteTitleThumbnail($title->getThumbnail());
            } catch (RuntimeException) {
                return $this->json(['error' => 'Thumbnail kon niet worden verwijderd.'], 500);
            }
        }

        $this->dataService->removeAndFlush($title);

        return $this->json(null, 204);
    }

    private function applyThumbnailChanges(Title $title, Request $request, array $body): ?JsonResponse
    {
        $removeThumbnail = $this->titleService->normalizeBoolean($body['removeThumbnail'] ?? false);
        $thumbFile = $request->files->get('thumbnail');

        if ($removeThumbnail && $title->getThumbnail()) {
            try {
                $this->fileUploadService->deleteTitleThumbnail($title->getThumbnail());
                $title->setThumbnail(null);
            } catch (RuntimeException) {
                return $this->json(['error' => 'Thumbnail kon niet worden verwijderd.'], 500);
            }
        }

        if ($thumbFile === null) {
            return null;
        }

        if (!$thumbFile instanceof UploadedFile) {
            return $this->badRequest('Ongeldige thumbnail upload.');
        }

        try {
            if ($title->getThumbnail()) {
                $this->fileUploadService->deleteTitleThumbnail($title->getThumbnail());
            }

            $title->setThumbnail($this->fileUploadService->uploadTitleThumbnail($thumbFile));
        } catch (InvalidArgumentException $exception) {
            return $this->badRequest($exception->getMessage());
        } catch (RuntimeException) {
            return $this->json(['error' => 'Thumbnail kon niet worden opgeslagen.'], 500);
        }

        return null;
    }
}