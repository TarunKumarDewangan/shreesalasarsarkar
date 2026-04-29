<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BacklogAccount extends Model
{
    protected $guarded = [];

    public function installments()
    {
        return $this->hasMany(BacklogInstallment::class, 'backlog_account_id');
    }
}
