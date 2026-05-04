<?php

namespace App\Controller;

use App\Entity\User;
use App\Repository\UserRepository;
use App\Service\JwtService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api')]
class AuthController extends AbstractController
{
    public function __construct(
        private JwtService $jwt,
        private EntityManagerInterface $em,
        private UserRepository $userRepository,
    ) {}

    #[Route('/register', methods: ['POST'])]
    public function register(Request $request): JsonResponse
    {
        $body = json_decode($request->getContent(), true);

        if (empty($body['email']) || empty($body['password'])) {
            return $this->json(['error' => 'Email and password are required'], 400);
        }

        if ($this->userRepository->findOneBy(['email' => $body['email']])) {
            return $this->json(['error' => 'Email already in use'], 409);
        }

        $user = new User();
        $user->setEmail($body['email']);
        $user->setPassword(password_hash($body['password'], PASSWORD_BCRYPT));

        $this->em->persist($user);
        $this->em->flush();

        return $this->json(['message' => 'User created'], 201);
    }

    #[Route('/login', methods: ['POST'])]
    public function login(Request $request): JsonResponse
    {
        $body = json_decode($request->getContent(), true);

        if (empty($body['email']) || empty($body['password'])) {
            return $this->json(['error' => 'Email and password are required'], 400);
        }

        $user = $this->userRepository->findOneBy(['email' => $body['email']]);

        if (!$user || !password_verify($body['password'], $user->getPassword())) {
            return $this->json(['error' => 'Invalid credentials'], 401);
        }

        $token = $this->jwt->generate($user->getId(), $user->getEmail());

        return $this->json(['token' => $token]);
    }
}