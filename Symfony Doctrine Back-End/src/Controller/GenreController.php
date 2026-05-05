<?php

namespace App\Controller;

use App\Entity\Genre;
use App\Repository\GenreRepository;
use App\Service\DataService;
use App\Service\SerializerService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/genres')]
class GenreController extends AbstractController
{
    public function __construct(
        private GenreRepository $genreRepository,
        private DataService $dataService,
        private SerializerService $serializer,
    ) {}

    #[Route('', methods: ['GET'])]
    public function index(): JsonResponse
    {
        $genres = $this->dataService->findAll(Genre::class);
        return $this->json(array_map(fn($g) => $this->serializer->serializeGenre($g), $genres));
    }

    #[Route('', methods: ['POST'])]
    public function create(Request $request): JsonResponse
    {
        $body = json_decode($request->getContent(), true);

        if (empty($body['name'])) {
            return $this->json(['error' => 'Naam is verplicht'], 400);
        }

        $existing = $this->dataService->findOneBy(Genre::class, ['name' => trim($body['name'])]);
        if ($existing) {
            return $this->json(['error' => 'Dit genre bestaat al', 'id' => $existing->getId(), 'name' => $existing->getName()], 409);
        }

        $genre = new Genre();
        $genre->setName(trim($body['name']));

        $this->dataService->persistAndFlush($genre);

        return $this->json($this->serializer->serializeGenre($genre), 201);
    }

    #[Route('/{id}', methods: ['DELETE'])]
    public function delete(Genre $genre): JsonResponse
    {
        $this->dataService->removeAndFlush($genre);
        return $this->json(null, 204);
    }
}
