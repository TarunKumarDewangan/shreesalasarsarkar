<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Vehicle extends Model
{
    use SoftDeletes;
    protected $fillable = [
        'borrower_id', 'condition_type', 'sold_by', 'model',
        'color', 'chassis_no', 'engine_no', 'make_year',
        'vehicle_no', 'insurance_expiry',
    ];

    protected $casts = ['insurance_expiry' => 'date'];

    public function borrower()
    {
        return $this->belongsTo(Borrower::class);
    }
}
