<?php

namespace App\Services\Contracts;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Model;

interface ServiceInterface
{
    public function list(array $filters = []): LengthAwarePaginator;
    public function create(array $data): mixed;
    public function update(int|string $id, array $data): mixed;
    public function delete(Model|int|string $idOrModel): void;
    public function find(int|string $id): mixed;
}
