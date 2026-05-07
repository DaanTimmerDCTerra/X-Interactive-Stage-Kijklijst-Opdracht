<?php

namespace App\Controller;

use JsonException;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;

abstract class ApiController extends AbstractController
{
    /**
     * @return array<string, mixed>|JsonResponse
     */
    protected function jsonBody(Request $request): array|JsonResponse
    {
        if (trim($request->getContent()) === '') {
            return [];
        }

        try {
            $body = json_decode($request->getContent(), true, 512, JSON_THROW_ON_ERROR);
        } catch (JsonException) {
            return $this->badRequest('Ongeldige JSON.');
        }

        if (!is_array($body)) {
            return $this->badRequest('JSON body moet een object zijn.');
        }

        return $body;
    }

    /**
     * @return array<string, mixed>|JsonResponse
     */
    protected function requestBody(Request $request): array|JsonResponse
    {
        $isFormRequest =
            $request->getContentTypeFormat() === 'form'
            || str_starts_with((string) $request->headers->get('Content-Type'), 'multipart/form-data')
            || str_starts_with((string) $request->headers->get('Content-Type'), 'application/x-www-form-urlencoded')
            || $request->request->count() > 0
            || $request->files->count() > 0;

        if ($isFormRequest) {
            $body = $request->request->all();

            if (isset($body['genres[]']) && !isset($body['genres'])) {
                $body['genres'] = $body['genres[]'];
                unset($body['genres[]']);
            }

            if (array_key_exists('genres', $body) && !is_array($body['genres'])) {
                $body['genres'] = [$body['genres']];
            }

            return $body;
        }

        $body = $this->jsonBody($request);

        if ($body instanceof JsonResponse) {
            return $body;
        }

        if (array_key_exists('genres', $body) && !is_array($body['genres'])) {
            $body['genres'] = [$body['genres']];
        }

        return $body;
    }

    protected function validateTitleBody(array $body): ?JsonResponse
    {
        $name = trim((string) ($body['name'] ?? ''));
        $year = $body['year'] ?? null;
        $genres = $body['genres'] ?? [];

        if ($name === '') {
            return $this->badRequest('Naam is verplicht.');
        }

        if ($year === null || $year === '') {
            return $this->badRequest('Jaartal is verplicht.');
        }

        if (!is_numeric($year)) {
            return $this->badRequest('Jaartal moet een geldig nummer zijn.');
        }

        if (!is_array($genres) || count($genres) === 0) {
            return $this->badRequest('Kies minimaal één genre.');
        }

        return null;
    }

    protected function badRequest(string $message): JsonResponse
    {
        return $this->json(['error' => $message], 400);
    }
}