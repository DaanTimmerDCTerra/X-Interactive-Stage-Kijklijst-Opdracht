<?php

namespace App\Repository;

use App\Entity\Title;
use App\Entity\User;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

class TitleRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Title::class);
    }

    public function findByUserWithFilters(
        User $user,
        ?string $search = null,
        ?string $type = null,
        ?string $watched = null,
        array $orderBy = ['name' => 'ASC', 'id' => 'ASC']
    ): array {
        $qb = $this->createQueryBuilder('t')
            ->where('t.user = :user')
            ->setParameter('user', $user);

        if ($search) {
            $qb->andWhere('LOWER(t.name) LIKE LOWER(:search)')
               ->setParameter('search', '%' . $search . '%');
        }

        if ($type && in_array($type, ['film', 'serie'])) {
            $qb->andWhere('t.type = :type')
               ->setParameter('type', $type);
        }

        if ($watched) {
            if ($watched === 'watched') {
                $qb->andWhere('t.watched = true');
            } elseif ($watched === 'unwatched') {
                $qb->andWhere('t.watched = false');
            }
        }

        foreach ($orderBy as $field => $direction) {
            $qb->addOrderBy('t.' . $field, $direction);
        }

        return $qb->getQuery()->getResult();
    }
}
