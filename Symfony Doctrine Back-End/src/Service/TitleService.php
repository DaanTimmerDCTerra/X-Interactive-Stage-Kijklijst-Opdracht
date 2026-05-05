<?php

namespace App\Service;

use App\Entity\Title;
use App\Entity\User;
use App\Repository\CommentRepository;
use App\Repository\TitleRepository;

class TitleService
{
    public function __construct(
        private TitleRepository $titleRepository,
        private CommentRepository $commentRepository,
    ) {}

    public function getTitleKey(Title $title): string
    {
        return mb_strtolower(trim((string)$title->getName())) . '|' . (string)$title->getType() . '|' . (string)$title->getYear();
    }

    public function getMatchingTitles(Title $title): array
    {
        $key = $this->getTitleKey($title);
        return array_values(array_filter(
            $this->titleRepository->findBy([], ['name' => 'ASC', 'id' => 'ASC']),
            fn(Title $candidate) => $this->getTitleKey($candidate) === $key
        ));
    }

    public function aggregateCommentStats(array $titles): array
    {
        $commentCount = 0;
        $ratingCount = 0;
        $ratingTotal = 0;

        foreach ($titles as $title) {
            $comments = $this->commentRepository->findBy(['title' => $title]);
            foreach ($comments as $comment) {
                $commentCount++;
                if ($comment->getRating() !== null) {
                    $ratingCount++;
                    $ratingTotal += $comment->getRating();
                }
            }
        }

        return [
            'commentCount' => $commentCount,
            'ratingCount' => $ratingCount,
            'averageRating' => $ratingCount > 0 ? round($ratingTotal / $ratingCount, 1) : null,
        ];
    }

    public function createTitleFromData(array $data): Title
    {
        $title = new Title();
        $title->setName($data['name'] ?? '');
        $title->setType($data['type'] ?? '');
        $title->setYear(isset($data['year']) ? (int)$data['year'] : null);
        return $title;
    }

    public function buildUploadFilename(object $file, string $prefix): string
    {
        $extension = method_exists($file, 'getClientOriginalExtension') ? trim((string)$file->getClientOriginalExtension()) : '';
        $extension = preg_replace('/[^a-zA-Z0-9]/', '', $extension) ?: 'bin';
        return uniqid($prefix) . '.' . $extension;
    }
}
