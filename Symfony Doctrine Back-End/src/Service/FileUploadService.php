<?php

namespace App\Service;

use InvalidArgumentException;
use RuntimeException;
use Symfony\Component\HttpFoundation\File\Exception\FileException;
use Symfony\Component\HttpFoundation\File\UploadedFile;

class FileUploadService
{
    private const MAX_TITLE_THUMBNAIL_SIZE = 5_000_000;
    private const MAX_PROFILE_PICTURE_SIZE = 2_000_000;

    private const IMAGE_EXTENSIONS = [
        'image/jpeg' => 'jpg',
        'image/png' => 'png',
        'image/webp' => 'webp',
    ];

    public function __construct(private string $projectDir) {}

    public function uploadTitleThumbnail(UploadedFile $file): string
    {
        return $this->uploadImage(
            $file,
            'thumb_',
            self::MAX_TITLE_THUMBNAIL_SIZE,
            $this->getUploadDir('titles'),
            'Thumbnail'
        );
    }

    public function uploadProfilePicture(UploadedFile $file): string
    {
        return $this->uploadImage(
            $file,
            'profile_',
            self::MAX_PROFILE_PICTURE_SIZE,
            $this->getUploadDir('profiles'),
            'Profielfoto'
        );
    }

    public function deleteTitleThumbnail(?string $filename): void
    {
        $this->deleteUploadedFile($filename, $this->getUploadDir('titles'));
    }

    public function deleteProfilePicture(?string $filename): void
    {
        $this->deleteUploadedFile($filename, $this->getUploadDir('profiles'));
    }

    private function uploadImage(
        UploadedFile $file,
        string $prefix,
        int $maxSize,
        string $uploadDir,
        string $label
    ): string {
        if (!$file->isValid()) {
            throw new InvalidArgumentException($label . ' upload is ongeldig.');
        }

        if ($file->getSize() !== null && $file->getSize() > $maxSize) {
            throw new InvalidArgumentException($label . ' is te groot.');
        }

        $mimeType = $file->getMimeType();
        if (!is_string($mimeType) || !isset(self::IMAGE_EXTENSIONS[$mimeType])) {
            throw new InvalidArgumentException($label . ' moet een jpg, png of webp afbeelding zijn.');
        }

        $filename = uniqid($prefix, true) . '.' . self::IMAGE_EXTENSIONS[$mimeType];

        try {
            $file->move($uploadDir, $filename);
        } catch (FileException $exception) {
            throw new RuntimeException($label . ' kon niet worden opgeslagen.', 0, $exception);
        }

        return $filename;
    }

    private function deleteUploadedFile(?string $filename, string $uploadDir): void
    {
        if (!$filename) {
            return;
        }

        $safeFilename = basename($filename);
        $path = $uploadDir . DIRECTORY_SEPARATOR . $safeFilename;

        if (is_file($path)) {
            unlink($path);
        }
    }

    private function getUploadDir(string $subdirectory): string
    {
        $uploadDir = $this->projectDir . DIRECTORY_SEPARATOR . 'public' . DIRECTORY_SEPARATOR . 'uploads' . DIRECTORY_SEPARATOR . $subdirectory;

        if (!is_dir($uploadDir) && !mkdir($uploadDir, 0755, true) && !is_dir($uploadDir)) {
            throw new RuntimeException('Uploadmap kon niet worden aangemaakt.');
        }

        return $uploadDir;
    }
}