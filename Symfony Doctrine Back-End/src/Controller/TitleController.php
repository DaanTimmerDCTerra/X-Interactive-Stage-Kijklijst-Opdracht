<?php

namespace App\Controller;

use App\Entity\Title;
use App\Repository\TitleRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/titles')]
class TitleController extends AbstractController
{
    public function __construct(
        private EntityManagerInterface $em,
        private TitleRepository $titleRepository,
    ) {}

    #[Route('', methods: ['GET'])]
    public function index(): JsonResponse
    {
        $titles = $this->titleRepository->findAll();

        $data = array_map(fn($t) => [
            'id'      => $t->getId(),
            'name'    => $t->getName(),
            'type'    => $t->getType(),
            'year'    => $t->getYear(),
            'watched' => (bool) $t->isWatched(),
        ], $titles);

        return $this->json($data);
    }

    #[Route('', methods: ['POST'])]
    public function create(Request $request): JsonResponse
    {
        $body = json_decode($request->getContent(), true);

        if (empty($body['name'])) {
            return $this->json(['error' => 'Name is required'], 400);
        }

        if (!in_array($body['type'] ?? '', ['film', 'serie'])) {
            return $this->json(['error' => 'Type must be film or serie'], 400);
        }

        if (isset($body['year']) && !is_numeric($body['year'])) {
            return $this->json(['error' => 'Year must be a number'], 400);
        }

        $title = new Title();
        $title->setName($body['name']);
        $title->setType($body['type']);
        $title->setYear(isset($body['year']) ? (int) $body['year'] : null);
        $title->setWatched($body['watched'] ?? false);

        $this->em->persist($title);
        $this->em->flush();

        return $this->json([
            'id'      => $title->getId(),
            'name'    => $title->getName(),
            'type'    => $title->getType(),
            'year'    => $title->getYear(),
            'watched' => (bool) $title->isWatched(),
        ], 201);
    }

    #[Route('/{id}', methods: ['DELETE'])]
    public function delete(Title $title): JsonResponse
    {
        $this->em->remove($title);
        $this->em->flush();

        return $this->json(null, 204);
    }

    #[Route('/{id}', methods: ['PATCH'])]
    public function update(Title $title, Request $request): JsonResponse
    {
        $body = json_decode($request->getContent(), true);

        if (isset($body['name'])) {
            if (empty($body['name'])) {
                return $this->json(['error' => 'Name cannot be empty'], 400);
            }
            $title->setName($body['name']);
        }

        if (isset($body['type'])) {
            if (!in_array($body['type'], ['film', 'serie'])) {
                return $this->json(['error' => 'Type must be film or serie'], 400);
            }
            $title->setType($body['type']);
        }

        if (array_key_exists('year', $body)) {
            $title->setYear($body['year'] ? (int) $body['year'] : null);
        }

        if (isset($body['watched'])) {
            $title->setWatched((bool) $body['watched']);
        }

        $this->em->flush();

        return $this->json([
            'id'      => $title->getId(),
            'name'    => $title->getName(),
            'type'    => $title->getType(),
            'year'    => $title->getYear(),
            'watched' => (bool) $title->isWatched(),
        ]);
    }
}