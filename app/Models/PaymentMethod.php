<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PaymentMethod extends Model
{
    protected $fillable = ['financer_id', 'name', 'is_active'];

    public function financer()
    {
        return $this->belongsTo(\App\Models\User::class, 'financer_id');
    }
}
