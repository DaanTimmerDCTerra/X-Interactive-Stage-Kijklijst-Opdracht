<?php

namespace App\Controller;

use App\Entity\User;
use App\Repository\UserRepository;
use App\Service\AuthService;
use App\Service\DataService;
use App\Service\JwtService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api')]
class AuthController extends AbstractController
{
    public function __construct(
        private JwtService $jwt,
        private UserRepository $userRepository,
        private DataService $dataService,
        private AuthService $authService,
    ) {}

    #[Route('/register', methods: ['POST'])]
    public function register(Request $request): JsonResponse
    {
        $body = json_decode($request->getContent(), true);

        if (empty($body['email']) || empty($body['password'])) {
            return $this->json(['error' => 'E-mailadres en wachtwoord zijn verplicht'], 400);
        }

        if ($this->dataService->findOneBy(User::class, ['email' => $body['email']])) {
            return $this->json(['error' => 'Dit e-mailadres is al in gebruik'], 409);
        }

        $user = $this->authService->register($body['email'], $body['password']);
        $this->dataService->persistAndFlush($user);

        $token = $this->jwt->generate($user->getId(), $user->getEmail());

        return $this->json(['message' => 'Gebruiker aangemaakt', 'token' => $token, 'email' => $user->getEmail()], 201);
    }

    #[Route('/login', methods: ['POST'])]
    public function login(Request $request): JsonResponse
    {
        $body = json_decode($request->getContent(), true);

        if (empty($body['email']) || empty($body['password'])) {
            return $this->json(['error' => 'E-mailadres en wachtwoord zijn verplicht'], 400);
        }

        $user = $this->dataService->findOneBy(User::class, ['email' => $body['email']]);

        if (!$user || !$this->authService->verifyPassword($user, $body['password'])) {
            return $this->json(['error' => 'Ongeldige inloggegevens'], 401);
        }

        $token = $this->jwt->generate($user->getId(), $user->getEmail());

        return $this->json(['token' => $token]);
    }
}
