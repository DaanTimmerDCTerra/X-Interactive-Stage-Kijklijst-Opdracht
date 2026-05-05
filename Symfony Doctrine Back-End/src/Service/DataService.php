<?php

namespace App\Service;

use Doctrine\ORM\EntityManagerInterface;
use Doctrine\ORM\EntityRepository;

class DataService
{
    public function __construct(private EntityManagerInterface $em) {}

    public function findAll(string $entityClass, array $orderBy = []): array
    {
        return $this->getRepository($entityClass)->findBy([], $orderBy);
    }

    public function findById(string $entityClass, int $id): ?object
    {
        return $this->getRepository($entityClass)->find($id);
    }

    public function findBy(string $entityClass, array $criteria, array $orderBy = [], ?int $limit = null, ?int $offset = null): array
    {
        return $this->getRepository($entityClass)->findBy($criteria, $orderBy, $limit, $offset);
    }

    public function findOneBy(string $entityClass, array $criteria): ?object
    {
        return $this->getRepository($entityClass)->findOneBy($criteria);
    }

    public function persist(object $entity): void
    {
        $this->em->persist($entity);
    }

    public function remove(object $entity): void
    {
        $this->em->remove($entity);
    }

    public function flush(): void
    {
        $this->em->flush();
    }

    public function persistAndFlush(object $entity): void
    {
        $this->persist($entity);
        $this->flush();
    }

    public function removeAndFlush(object $entity): void
    {
        $this->remove($entity);
        $this->flush();
    }

    private function getRepository(string $entityClass): EntityRepository
    {
        return $this->em->getRepository($entityClass);
    }
}
