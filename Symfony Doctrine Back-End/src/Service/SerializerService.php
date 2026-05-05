<?php

namespace App\Service;

use App\Entity\Comment;
use App\Entity\Genre;
use App\Entity\Title;
use App\Entity\User;

class SerializerService
{
    public function __construct(private TitleService $titleService) {}

    public function serializeTitle(Title $title, ?User $currentUser = null, ?array $stats = null): array
    {
        $stats ??= $this->titleService->aggregateCommentStats($this->titleService->getMatchingTitles($title));

        return [
            'id' => $title->getId(),
            'name' => $title->getName(),
            'type' => $title->getType(),
            'year' => $title->getYear(),
            'watched' => (bool)$title->isWatched(),
            'rating' => $title->getRating(),
            'averageRating' => $stats['averageRating'],
            'commentCount' => $stats['commentCount'],
            'public' => (bool)$title->isPublic(),
            'favorite' => (bool)$title->isFavorite(),
            'owner' => $title->getUser()?->getEmail(),
            'ownedByCurrentUser' => $currentUser && $title->getUser() && $title->getUser()->getId() === $currentUser->getId(),
            'genres' => $title->getGenres()->map(fn($g) => [
                'id' => $g->getId(),
                'name' => $g->getName(),
            ])->toArray(),
            'thumbnail' => $title->getThumbnail() ? '/uploads/titles/' . $title->getThumbnail() : null,
        ];
    }

    public function serializeComment(Comment $comment): array
    {
        return [
            'id' => $comment->getId(),
            'content' => $comment->getContent(),
            'rating' => $comment->getRating(),
            'createdAt' => $comment->getCreatedAt()->format('Y-m-d H:i'),
            'user' => $comment->getUser()->getEmail(),
        ];
    }

    public function serializeGenre(Genre $genre): array
    {
        return [
            'id' => $genre->getId(),
            'name' => $genre->getName(),
        ];
    }
}
