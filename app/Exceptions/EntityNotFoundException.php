<?php

namespace App\Exceptions;

use App\Helpers\HttpStatus;

class EntityNotFoundException extends BusinessException
{
    public function __construct(
        string $entity = 'Resource',
        ?int $id = null,
        ?\Throwable $previous = null
    ) {
        $message = $id
            ? "{$entity} with ID {$id} not found."
            : "{$entity} not found.";

        parent::__construct(
            message: $message,
            publicMessage: __("errors.{$entity}_not_found", ['id' => $id]),
            code: HttpStatus::NOT_FOUND,
            previous: $previous,
        );
    }
}
