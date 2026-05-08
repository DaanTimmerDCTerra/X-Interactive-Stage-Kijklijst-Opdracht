<?php

namespace App\Service;

use Firebase\JWT\JWT;
use Firebase\JWT\Key;

class JwtService
{
    public function __construct(private string $secret) {}

    public function generate(int $userId, string $email): string
    {
        $payload = [
            'typ'   => 'access',
            'sub'   => $userId,
            'email' => $email,
            'iat'   => time(),
            'exp'   => time() + (60 * 60 * 24 * 7),
        ];

        return JWT::encode($payload, $this->secret, 'HS256');
    }

    public function encodePayload(array $payload): string
    {
        return JWT::encode($payload, $this->secret, 'HS256');
    }

    public function decode(string $token): object
    {
        return JWT::decode($token, new Key($this->secret, 'HS256'));
    }
}
