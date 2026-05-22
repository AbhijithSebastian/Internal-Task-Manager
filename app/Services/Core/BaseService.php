<?php

namespace App\Services\Core;

use App\Exceptions\EntityNotFoundException;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\Relation;
use Illuminate\Support\Facades\DB;

abstract class BaseService
{
    protected const DEFAULT_PER_PAGE = 15;
    protected const MAX_PER_PAGE = 100;

    abstract protected function model(): string;

    protected function query(): Builder
    {
        return ($this->model())::query();
    }

    public function find(int|string $id): Model
    {
        $model = $this->query()->find($id);

        if (!$model) {
            throw new EntityNotFoundException(
                entity: class_basename($this->model()),
                id: (int) $id,
            );
        }

        return $model;
    }

    public function findOrFail(int|string $id): Model
    {
        return $this->query()->findOrFail($id);
    }

    public function delete(Model|int|string $idOrModel): void
    {
        $model = $idOrModel instanceof Model ? $idOrModel : $this->find($idOrModel);
        $model->delete();
    }

    protected function paginate(Builder|Relation $query, ?int $perPage = null): LengthAwarePaginator
    {
        $perPage = min(
            $perPage ?? static::DEFAULT_PER_PAGE,
            static::MAX_PER_PAGE
        );

        return $query->paginate($perPage);
    }

    protected function sort(
        Builder|Relation $query,
        ?string $sortBy = null,
        ?string $sortDirection = 'desc',
        array $allowedSorts = ['created_at'],
    ): Builder|Relation {
        $sortBy = in_array($sortBy, $allowedSorts) ? $sortBy : 'created_at';
        $sortDirection = in_array($sortDirection, ['asc', 'desc']) ? $sortDirection : 'desc';

        return $query->orderBy($sortBy, $sortDirection);
    }

    protected function transaction(callable $callback): mixed
    {
        return DB::transaction($callback);
    }

    protected function search(Builder $query, ?string $term, array $columns = ['name', 'title']): Builder
    {
        if (!$term) {
            return $query;
        }

        return $query->where(function (Builder $q) use ($term, $columns) {
            foreach ($columns as $column) {
                $q->orWhere($column, 'ilike', "%{$term}%");
            }
        });
    }
}
