<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BacklogInstallment extends Model
{
    protected $guarded = [];

    public function account()
    {
        return $this->belongsTo(BacklogAccount::class, 'backlog_account_id');
    }
}
