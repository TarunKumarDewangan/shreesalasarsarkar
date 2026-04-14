<?php

namespace App\Http\Middleware;

use Illuminate\Foundation\Http\Middleware\TransformsRequest;

class UppercaseStrings extends TransformsRequest
{
    /**
     * The attributes that should not be transformed.
     *
     * @var array<int, string>
     */
    protected $except = [
        'email',
        'password',
        'password_confirmation',
        'current_password',
        'new_password',
        'username',
        'user_name',
        'access_token',
        'instance_id',
    ];

    /**
     * Transform the given value.
     *
     * @param  string  $key
     * @param  mixed  $value
     * @return mixed
     */
    protected function transform($key, $value)
    {
        if (in_array($key, $this->except, true)) {
            return $value;
        }

        return is_string($value) ? mb_strtoupper($value) : $value;
    }
}
