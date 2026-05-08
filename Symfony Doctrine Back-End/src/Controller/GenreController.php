<?php

namespace App\Controller;

use App\Entity\Genre;
use App\Service\AuthService;
use App\Service\DataService;
use App\Service\SerializerService;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/genres')]
final class GenreController extends ApiController
{
    private const MAX_GENRE_NAME_LENGTH = 100;

    public function __construct(
        private readonly DataService $dataService,
        private readonly SerializerService $serializer,
        private readonly AuthService $authService,
    ) {}

    #[Route('', methods: ['GET'])]
    public function index(Request $request): JsonResponse
    {
        $this->authService->requireAuthenticatedUser($request);

        $genres = $this->dataService->findAll(Genre::class);
        return $this->json(array_map(fn($g) => $this->serializer->serializeGenre($g), $genres));
    }

    #[Route('', methods: ['POST'])]
    public function create(Request $request): JsonResponse
    {
        $this->authService->requireAuthenticatedUser($request);

        $body = $this->jsonBody($request);
        if ($body instanceof JsonResponse) {
            return $body;
        }

        $name = $this->normalizeName($body['name'] ?? null);
        if ($name === null) {
            return $this->badRequest('Naam is verplicht');
        }

        $existing = $this->dataService->findOneBy(Genre::class, ['name' => $name]);
        if ($existing) {
            return $this->json(['error' => 'Dit genre bestaat al', 'id' => $existing->getId(), 'name' => $existing->getName()], 409);
        }

        $genre = new Genre();
        $genre->setName($name);

        $this->dataService->persistAndFlush($genre);

        return $this->json($this->serializer->serializeGenre($genre), 201);
    }

    #[Route('/{id}', methods: ['DELETE'])]
    public function delete(Genre $genre, Request $request): JsonResponse
    {
        $this->authService->requireAuthenticatedUser($request);

        if (!$genre->getTitles()->isEmpty()) {
            return $this->badRequest('Genre is nog gekoppeld aan een titel.');
        }

        $this->dataService->removeAndFlush($genre);
        return $this->json(null, 204);
    }

    private function normalizeName(mixed $name): ?string
    {
        if (!is_string($name)) {
            return null;
        }

        $name = trim($name);

        if ($name === '' || mb_strlen($name) > self::MAX_GENRE_NAME_LENGTH) {
            return null;
        }

        return $name;
    }
}
