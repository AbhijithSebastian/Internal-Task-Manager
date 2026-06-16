<?php

namespace App\Exceptions;

use App\Helpers\HttpStatus;

class ForbiddenException extends BusinessException
{
    public function __construct(
        string $message = 'Forbidden.',
        ?\Throwable $previous = null
    ) {
        parent::__construct(
            message: $message,
            publicMessage: __('auth.forbidden'),
            code: HttpStatus::FORBIDDEN,
            previous: $previous,
        );
    }
}
