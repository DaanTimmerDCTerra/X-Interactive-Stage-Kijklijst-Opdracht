<?php

namespace App\Service;

use App\Entity\User;
use App\Repository\UserRepository;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpKernel\Exception\UnauthorizedHttpException;

class AuthService
{
    public function __construct(private UserRepository $userRepository) {}

    public function getAuthenticatedUser(Request $request): ?User
    {
        try {
            return $this->requireAuthenticatedUser($request);
        } catch (UnauthorizedHttpException) {
            return null;
        }
    }

    public function requireAuthenticatedUser(Request $request): User
    {
        $payload = $request->attributes->get('jwtPayload');
        if (!$payload || !isset($payload->sub, $payload->email)) {
            throw new UnauthorizedHttpException('Bearer', 'Unauthorized');
        }

        if (($payload->typ ?? 'access') !== 'access') {
            throw new UnauthorizedHttpException('Bearer', 'Unauthorized');
        }

        $user = $this->userRepository->find((int) $payload->sub);
        if (!$user) {
            throw new UnauthorizedHttpException('Bearer', 'Unauthorized');
        }

        return $user;
    }

    public function register(string $email, string $password): User
    {
        $user = new User();
        $user->setEmail($email);
        $user->setPassword(password_hash($password, PASSWORD_BCRYPT));
        return $user;
    }

    public function verifyPassword(User $user, string $password): bool
    {
        return password_verify($password, $user->getPassword());
    }
}
