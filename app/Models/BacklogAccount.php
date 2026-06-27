<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class BacklogAccount extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'sno', 'fno', 'pno', 'zone', 'cbcode', 'customer_name', 'father_name',
        'mobile', 'address', 'guarantor_name', 'vehicle_model', 'vehicle_color',
        'chassis_no', 'engine_no', 'vehicle_make', 'vehicle_no',
        'total_months', 'interval', 'finance_amount', 'agreement_amount',
        'hp_amount', 'interest_amount', 'total_amount', 'interest_rate',
        'installment_amount', 'type', 'is_active', 'recovery_man_id', 'collection_date',
    ];

    public function installments()
    {
        return $this->hasMany(BacklogInstallment::class, 'backlog_account_id');
    }

    public function recoveryMan()
    {
        return $this->belongsTo(User::class, 'recovery_man_id');
    }
}
