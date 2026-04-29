<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('backlog_installments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('backlog_account_id')->constrained('backlog_accounts')->onDelete('cascade');
            $table->integer('fno')->nullable(); // Link for matching
            $table->integer('rno')->nullable();
            $table->integer('installment_no')->nullable();
            $table->decimal('installment_amount', 12, 2)->nullable();
            $table->decimal('paid_amount', 12, 2)->nullable();
            $table->decimal('balance_amount', 12, 2)->nullable();
            $table->date('due_date')->nullable();
            $table->date('payment_date')->nullable();
            $table->integer('delay_days')->nullable();
            $table->string('mode')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('backlog_installments');
    }
};
