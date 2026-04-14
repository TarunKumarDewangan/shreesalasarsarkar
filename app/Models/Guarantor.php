<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Guarantor extends Model
{
    use SoftDeletes;
    protected $fillable = ['borrower_id', 'name', 'father_name', 'mobile', 'address'];

    public function borrower()
    {
        return $this->belongsTo(Borrower::class);
    }
}
