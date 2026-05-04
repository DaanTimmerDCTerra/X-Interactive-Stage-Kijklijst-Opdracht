<?php

namespace App\EventListener;

use App\Service\JwtService;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpKernel\Event\RequestEvent;

class JwtAuthListener
{
    private array $protectedPrefixes = ['/api/titles'];

    public function __construct(private JwtService $jwt) {}

    public function onKernelRequest(RequestEvent $event): void
    {
        $request = $event->getRequest();
        $path = $request->getPathInfo();

        $isProtected = array_filter(
            $this->protectedPrefixes,
            fn($prefix) => str_starts_with($path, $prefix)
        );

        if (!$isProtected) {
            return;
        }

        $authHeader = $request->headers->get('Authorization');

        if (!$authHeader || !str_starts_with($authHeader, 'Bearer ')) {
            $event->setResponse(new JsonResponse(['error' => 'Missing token'], 401));
            return;
        }

        $token = substr($authHeader, 7);

        try {
            $decoded = $this->jwt->decode($token);
            $request->attributes->set('jwt_payload', $decoded);
        } catch (\Exception) {
            $event->setResponse(new JsonResponse(['error' => 'Invalid or expired token'], 401));
        }
    }
}