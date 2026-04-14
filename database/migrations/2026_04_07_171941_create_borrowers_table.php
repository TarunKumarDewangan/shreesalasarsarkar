<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('borrowers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('financer_id')->constrained('users')->onDelete('cascade');
            $table->enum('folio_prefix', ['O', 'S', 'KC'])->default('O');
            $table->string('folio_no', 20);
            $table->string('zone', 100)->nullable();
            $table->string('name');
            $table->string('father_name')->nullable();
            $table->string('mobile', 20)->nullable();
            $table->string('mobile2', 20)->nullable();
            $table->string('aadhar', 20)->nullable();
            $table->string('pan', 20)->nullable();
            $table->date('dob')->nullable();
            $table->text('address')->nullable();
            $table->timestamps();

            $table->unique(['financer_id', 'folio_prefix', 'folio_no']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('borrowers');
    }
};
