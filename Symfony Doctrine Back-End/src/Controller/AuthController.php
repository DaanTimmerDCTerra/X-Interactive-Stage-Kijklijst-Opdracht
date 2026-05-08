<?php

namespace App\Controller;

use App\Entity\User;
use App\Repository\UserRepository;
use App\Service\AuthService;
use App\Service\DataService;
use App\Service\FileUploadService;
use App\Service\JwtService;
use App\Service\SnakeScoreService;
use InvalidArgumentException;
use RuntimeException;
use Symfony\Component\HttpFoundation\File\UploadedFile;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpKernel\Exception\UnauthorizedHttpException;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api')]
final class AuthController extends ApiController
{
    private const MIN_PASSWORD_LENGTH = 8;

    public function __construct(
        private readonly JwtService $jwt,
        private readonly UserRepository $userRepository,
        private readonly DataService $dataService,
        private readonly AuthService $authService,
        private readonly SnakeScoreService $snakeScoreService,
        private readonly FileUploadService $fileUploadService,
    ) {}

    #[Route('/register', methods: ['POST'])]
    public function register(Request $request): JsonResponse
    {
        $body = $this->jsonBody($request);

        if ($body instanceof JsonResponse) {
            return $body;
        }

        $email = $this->normalizeEmail($body['email'] ?? null);
        $password = $body['password'] ?? null;

        if (!$email || !$this->isValidPassword($password)) {
            return $this->badRequest('Vul een geldig e-mailadres en wachtwoord van minimaal 8 tekens in.');
        }

        if ($this->userRepository->findOneBy(['email' => $email])) {
            return $this->json(['error' => 'Dit e-mailadres is al in gebruik'], 409);
        }

        $user = $this->authService->register($email, $password);
        $this->dataService->persistAndFlush($user);

        return $this->json([
            'message' => 'Gebruiker aangemaakt',
            'token' => $this->jwt->generate($user->getId(), $user->getEmail()),
            'user' => $this->serializeUser($user),
        ], 201);
    }

    #[Route('/login', methods: ['POST'])]
    public function login(Request $request): JsonResponse
    {
        $body = $this->jsonBody($request);

        if ($body instanceof JsonResponse) {
            return $body;
        }

        $email = $this->normalizeEmail($body['email'] ?? null);
        $password = $body['password'] ?? null;

        if (!$email || !is_string($password) || $password === '') {
            return $this->badRequest('E-mailadres en wachtwoord zijn verplicht.');
        }

        $user = $this->userRepository->findOneBy(['email' => $email]);

        if (!$user || !$this->authService->verifyPassword($user, $password)) {
            return $this->json(['error' => 'Ongeldige inloggegevens'], 401);
        }

        return $this->json([
            'token' => $this->jwt->generate($user->getId(), $user->getEmail()),
            'user' => $this->serializeUser($user),
        ]);
    }

    #[Route('/profile', methods: ['GET'])]
    public function getProfile(Request $request): JsonResponse
    {
        $user = $this->getAuthenticatedUser($request);

        if ($user instanceof JsonResponse) {
            return $user;
        }

        return $this->json($this->serializeUser($user));
    }

    #[Route('/profile', methods: ['PATCH'])]
    public function updateProfile(Request $request): JsonResponse
    {
        $user = $this->getAuthenticatedUser($request);

        if ($user instanceof JsonResponse) {
            return $user;
        }

        $profilePicture = $request->files->get('profilePicture');

        if (!$profilePicture instanceof UploadedFile) {
            return $this->badRequest('Profielfoto is verplicht.');
        }

        try {
            $user->setProfilePicture($this->fileUploadService->uploadProfilePicture($profilePicture));
            $this->dataService->persistAndFlush($user);
        } catch (InvalidArgumentException $exception) {
            return $this->badRequest($exception->getMessage());
        } catch (RuntimeException) {
            return $this->json(['error' => 'Profielfoto kon niet worden opgeslagen.'], 500);
        }

        return $this->json([
            'message' => 'Profiel bijgewerkt',
            'user' => $this->serializeUser($user),
        ]);
    }

    #[Route('/snake/score', methods: ['GET'])]
    public function getSnakeScore(Request $request): JsonResponse
    {
        $user = $this->getAuthenticatedUser($request);

        if ($user instanceof JsonResponse) {
            return $user;
        }

        return $this->json([
            'bestScore' => $user->getBestSnakeScore(),
        ]);
    }

    #[Route('/snake/score/start', methods: ['POST'])]
    public function startSnakeScore(Request $request): JsonResponse
    {
        $user = $this->getAuthenticatedUser($request);

        if ($user instanceof JsonResponse) {
            return $user;
        }

        return $this->json($this->snakeScoreService->startRun($user));
    }

    #[Route('/snake/score/event', methods: ['POST'])]
    public function recordSnakeScoreEvent(Request $request): JsonResponse
    {
        $user = $this->getAuthenticatedUser($request);

        if ($user instanceof JsonResponse) {
            return $user;
        }

        $body = $this->jsonBody($request);

        if ($body instanceof JsonResponse) {
            return $body;
        }

        try {
            return $this->json($this->snakeScoreService->recordEvent(
                $user,
                $body['runToken'] ?? null,
                $body['points'] ?? null,
            ));
        } catch (InvalidArgumentException $exception) {
            return $this->badRequest($exception->getMessage());
        }
    }

    private function getAuthenticatedUser(Request $request): User|JsonResponse
    {
        try {
            return $this->authService->requireAuthenticatedUser($request);
        } catch (UnauthorizedHttpException) {
            return $this->json(['error' => 'Unauthorized'], 401);
        }
    }

    private function normalizeEmail(mixed $email): ?string
    {
        if (!is_string($email)) {
            return null;
        }

        $email = strtolower(trim($email));

        return filter_var($email, FILTER_VALIDATE_EMAIL) ? $email : null;
    }

    private function isValidPassword(mixed $password): bool
    {
        return is_string($password) && mb_strlen($password) >= self::MIN_PASSWORD_LENGTH;
    }

    private function serializeUser(User $user): array
    {
        return [
            'email' => $user->getEmail(),
            'profilePicture' => $user->getProfilePicture() ? '/uploads/profiles/' . $user->getProfilePicture() : null,
        ];
    }
}
