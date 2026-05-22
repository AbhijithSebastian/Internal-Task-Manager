<?php

namespace App\Exceptions;

use App\Helpers\HttpStatus;

class AuthenticationException extends BusinessException
{
    public function __construct(
        string $message = 'Unauthenticated.',
        ?\Throwable $previous = null
    ) {
        parent::__construct(
            message: $message,
            publicMessage: __('auth.unauthenticated'),
            code: HttpStatus::UNAUTHORIZED,
            previous: $previous,
        );
    }
}
