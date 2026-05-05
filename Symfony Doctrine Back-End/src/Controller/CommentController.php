<?php

namespace App\Controller;

use App\Entity\Comment;
use App\Entity\Title;
use App\Repository\CommentRepository;
use App\Repository\TitleRepository;
use App\Service\AuthService;
use App\Service\DataService;
use App\Service\SerializerService;
use App\Service\TitleService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/titles/{titleId}/comments')]
class CommentController extends AbstractController
{
    public function __construct(
        private CommentRepository $commentRepository,
        private TitleRepository $titleRepository,
        private DataService $dataService,
        private AuthService $authService,
        private TitleService $titleService,
        private SerializerService $serializer,
    ) {}

    #[Route('', methods: ['GET'])]
    public function index(int $titleId, Request $request): JsonResponse
    {
        $user = $this->authService->getAuthenticatedUser($request);
        $title = $this->dataService->findById(Title::class, $titleId);
        if (!$title) {
            return $this->json(['error' => 'Titel niet gevonden'], 404);
        }

        $allTitles = $this->dataService->findAll(Title::class, ['name' => 'ASC', 'id' => 'ASC']);
        $matchingTitles = array_values(array_filter(
            $allTitles,
            fn($candidate) => $this->titleService->getTitleKey($candidate) === $this->titleService->getTitleKey($title)
        ));

        if (count($matchingTitles) > 0) {
            $allComments = [];
            foreach ($matchingTitles as $matchingTitle) {
                $allComments = array_merge(
                    $allComments,
                    $this->dataService->findBy(Comment::class, ['title' => $matchingTitle], ['createdAt' => 'DESC'])
                );
            }

            usort($allComments, fn($a, $b) => $b->getCreatedAt()->getTimestamp() <=> $a->getCreatedAt()->getTimestamp());
        } else {
            $allComments = $this->dataService->findBy(Comment::class, ['title' => $title], ['createdAt' => 'DESC']);
        }

        return $this->json(array_map(fn($c) => $this->serializer->serializeComment($c), $allComments));
    }

    #[Route('', methods: ['POST'])]
    public function create(int $titleId, Request $request): JsonResponse
    {
        $user = $this->authService->getAuthenticatedUser($request);
        $title = $this->dataService->findById(Title::class, $titleId);

        if (!$title) {
            return $this->json(['error' => 'Titel niet gevonden'], 404);
        }

        if (!$title->isPublic() && $title->getUser() !== $user) {
            return $this->json(['error' => 'Je mag geen comments plaatsen op deze titel'], 403);
        }

        $body = json_decode($request->getContent(), true);

        if (empty($body['content'])) {
            return $this->json(['error' => 'Reactie mag niet leeg zijn'], 400);
        }

        if (!isset($body['rating']) || !is_numeric($body['rating'])) {
            return $this->json(['error' => 'Rating is verplicht'], 400);
        }

        $rating = (int)$body['rating'];
        if ($rating < 1 || $rating > 5) {
            return $this->json(['error' => 'Rating moet tussen 1 en 5 zijn'], 400);
        }

        $comment = new Comment();
        $comment->setContent($body['content']);
        $comment->setRating($rating);
        $comment->setCreatedAt(new \DateTimeImmutable());
        $comment->setUser($user);
        $comment->setTitle($title);

        $this->dataService->persistAndFlush($comment);

        return $this->json($this->serializer->serializeComment($comment), 201);
    }

    #[Route('/{id}', methods: ['DELETE'])]
    public function delete(int $titleId, int $id, Request $request): JsonResponse
    {
        $user = $this->authService->getAuthenticatedUser($request);
        $comment = $this->dataService->findById(Comment::class, $id);

        if (!$comment || $comment->getTitle()->getId() !== $titleId) {
            return $this->json(['error' => 'Niet gevonden'], 404);
        }

        if ($comment->getUser() !== $user) {
            return $this->json(['error' => 'Geen toegang'], 403);
        }

        $this->dataService->removeAndFlush($comment);

        return $this->json(null, 204);
    }
}
