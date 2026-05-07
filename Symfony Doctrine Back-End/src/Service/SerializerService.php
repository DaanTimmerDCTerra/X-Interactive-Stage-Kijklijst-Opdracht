<?php

namespace App\Service;

use App\Entity\Genre;
use App\Entity\Title;
use App\Entity\User;

class SerializerService
{
    public function serializeTitle(Title $title, ?User $currentUser = null): array
    {
        return [
            'id' => $title->getId(),
            'name' => $title->getName(),
            'type' => $title->getType(),
            'year' => $title->getYear(),
            'watched' => (bool)$title->isWatched(),
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

    public function serializeGenre(Genre $genre): array
    {
        return [
            'id' => $genre->getId(),
            'name' => $genre->getName(),
        ];
    }
}
