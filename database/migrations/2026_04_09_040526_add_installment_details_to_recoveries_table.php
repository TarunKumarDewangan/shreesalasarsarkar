<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('recoveries', function (Blueprint $table) {
            $table->foreignId('installment_id')->nullable()->constrained('installments')->nullOnDelete();
            $table->decimal('penalty', 10, 2)->default(0);
            $table->decimal('discount', 10, 2)->default(0);
            $table->string('payment_method')->nullable();
            $table->string('receipt_no')->nullable();
            $table->date('paid_date')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('recoveries', function (Blueprint $table) {
            $table->dropForeign(['installment_id']);
            $table->dropColumn(['installment_id', 'penalty', 'discount', 'payment_method', 'receipt_no', 'paid_date']);
        });
    }
};
