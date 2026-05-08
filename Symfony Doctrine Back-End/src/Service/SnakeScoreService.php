<?php

namespace App\Service;

use App\Entity\User;
use InvalidArgumentException;
use Throwable;

class SnakeScoreService
{
    private const RUN_TOKEN_TYPE = 'snake_run';
    private const RUN_TTL_SECONDS = 1_800;
    private const MAX_SNAKE_SCORE = 1_000_000;
    private const START_GRACE_POINTS = 10;
    private const MAX_POINTS_PER_SECOND = 6;
    private const ALLOWED_EVENT_POINTS = [1, 3];

    public function __construct(
        private readonly JwtService $jwt,
        private readonly DataService $dataService,
    ) {}

    public function startRun(User $user): array
    {
        return [
            'runToken' => $this->createRunToken($user, 0, 0, time()),
            'score' => 0,
            'bestScore' => $user->getBestSnakeScore(),
        ];
    }

    public function recordEvent(User $user, mixed $runToken, mixed $points): array
    {
        if (!is_string($runToken) || $runToken === '') {
            throw new InvalidArgumentException('Snake run ontbreekt.');
        }

        if (!is_int($points) || !in_array($points, self::ALLOWED_EVENT_POINTS, true)) {
            throw new InvalidArgumentException('Ongeldig snake score event.');
        }

        $payload = $this->decodeRunToken($runToken);
        $this->assertRunPayloadMatchesUser($payload, $user);

        $score = (int) $payload->score;
        $events = (int) $payload->events;
        $issuedAt = (int) $payload->iat;
        $newScore = $score + $points;

        if ($newScore > self::MAX_SNAKE_SCORE) {
            throw new InvalidArgumentException('Ongeldige score.');
        }

        $elapsedSeconds = max(1, time() - $issuedAt);
        $maxScoreForElapsedTime = self::START_GRACE_POINTS + ($elapsedSeconds * self::MAX_POINTS_PER_SECOND);

        if ($newScore > $maxScoreForElapsedTime) {
            throw new InvalidArgumentException('Score loopt te snel op.');
        }

        if ($newScore > $user->getBestSnakeScore()) {
            $user->setBestSnakeScore($newScore);
            $this->dataService->persistAndFlush($user);
        }

        return [
            'runToken' => $this->createRunToken($user, $newScore, $events + 1, $issuedAt),
            'score' => $newScore,
            'bestScore' => $user->getBestSnakeScore(),
        ];
    }

    private function createRunToken(User $user, int $score, int $events, int $issuedAt): string
    {
        return $this->jwt->encodePayload([
            'typ' => self::RUN_TOKEN_TYPE,
            'sub' => $user->getId(),
            'score' => $score,
            'events' => $events,
            'iat' => $issuedAt,
            'exp' => $issuedAt + self::RUN_TTL_SECONDS,
        ]);
    }

    private function decodeRunToken(string $runToken): object
    {
        try {
            return $this->jwt->decode($runToken);
        } catch (Throwable) {
            throw new InvalidArgumentException('Ongeldige snake run.');
        }
    }

    private function assertRunPayloadMatchesUser(object $payload, User $user): void
    {
        if (
            ($payload->typ ?? null) !== self::RUN_TOKEN_TYPE
            || !isset($payload->sub, $payload->score, $payload->events, $payload->iat)
            || (int) $payload->sub !== $user->getId()
            || !is_numeric($payload->score)
            || !is_numeric($payload->events)
            || !is_numeric($payload->iat)
            || (int) $payload->score < 0
            || (int) $payload->events < 0
        ) {
            throw new InvalidArgumentException('Ongeldige snake run.');
        }
    }
}
