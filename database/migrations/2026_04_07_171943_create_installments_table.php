<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('installments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('loan_id')->constrained()->onDelete('cascade');
            $table->date('due_date');
            $table->decimal('amount_due', 12, 2)->default(0);
            $table->enum('status', ['PENDING', 'PAID'])->default('PENDING');
            $table->date('paid_date')->nullable();
            $table->decimal('penalty', 12, 2)->default(0);
            $table->decimal('discount', 12, 2)->default(0);
            $table->decimal('amount_paid', 12, 2)->default(0);
            $table->enum('method', ['CASH', 'ONLINE'])->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('installments');
    }
};
