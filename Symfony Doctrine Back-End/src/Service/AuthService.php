<?php

namespace App\Service;

use App\Entity\User;
use App\Repository\UserRepository;
use Symfony\Component\HttpFoundation\Request;

class AuthService
{
    public function __construct(private UserRepository $userRepository) {}

    public function getAuthenticatedUser(Request $request): ?User
    {
        $payload = $request->attributes->get('jwtPayload');
        if (!$payload || !isset($payload->sub)) {
            return null;
        }
        return $this->userRepository->find($payload->sub);
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
