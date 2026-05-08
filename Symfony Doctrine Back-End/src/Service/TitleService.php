<?php

namespace App\Service;

use App\Entity\Title;
use App\Repository\TitleRepository;

class TitleService
{
    private const MAX_TITLE_NAME_LENGTH = 255;
    private const MIN_TITLE_YEAR = 1888;
    private const ALLOWED_TYPES = ['film', 'serie'];

    public function __construct(
        private TitleRepository $titleRepository,
    ) {}

    public function getTitleKey(Title $title): string
    {
        return $this->buildTitleKey(
            (string) $title->getName(),
            (string) $title->getType(),
            $title->getYear()
        );
    }

    public function getTitleKeyFromData(array $data): string
    {
        return $this->buildTitleKey(
            (string) ($data['name'] ?? ''),
            (string) ($data['type'] ?? ''),
            $this->normalizeYear($data['year'] ?? null)
        );
    }

    public function getMatchingTitles(Title $title): array
    {
        $key = $this->getTitleKey($title);
        return array_values(array_filter(
            $this->titleRepository->findBy([], ['name' => 'ASC', 'id' => 'ASC']),
            fn(Title $candidate) => $this->getTitleKey($candidate) === $key
        ));
    }

    public function normalizeYear(mixed $year): ?int
    {
        if ($year === null || $year === '') {
            return null;
        }

        return (int) $year;
    }

    public function normalizeName(mixed $name): ?string
    {
        if (!is_string($name)) {
            return null;
        }

        $name = trim($name);

        if ($name === '' || mb_strlen($name) > self::MAX_TITLE_NAME_LENGTH) {
            return null;
        }

        return $name;
    }

    public function normalizeType(mixed $type): ?string
    {
        return is_string($type) && in_array($type, self::ALLOWED_TYPES, true) ? $type : null;
    }

    public function isValidYear(mixed $year): bool
    {
        if ($year === null || $year === '') {
            return true;
        }

        if (!is_numeric($year)) {
            return false;
        }

        $year = (int) $year;

        return $year >= self::MIN_TITLE_YEAR && $year <= (int) date('Y');
    }

    public function normalizeBoolean(mixed $value): bool
    {
        return $value === true || $value === 1 || $value === '1';
    }

    public function normalizeGenreIds(mixed $genreIds): ?array
    {
        if ($genreIds === null) {
            return [];
        }

        if (!is_array($genreIds)) {
            return null;
        }

        $normalized = [];

        foreach ($genreIds as $genreId) {
            if (!is_numeric($genreId) || (int) $genreId < 1) {
                return null;
            }

            $normalized[] = (int) $genreId;
        }

        return array_values(array_unique($normalized));
    }

    private function buildTitleKey(string $name, string $type, ?int $year): string
    {
        return mb_strtolower(trim($name)) . '|' . $type . '|' . (string) $year;
    }
}
