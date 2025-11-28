<script setup lang="ts">
import Header from '@/components/Header.vue';
import Hero from '@/components/Hero.vue';
<<<<<<< HEAD
import Interests from '@/components/Interests.vue';
import Advantages from '@/components/Advantages.vue';
import SecureInterest from '@/components/SecureInterest.vue'
import Convinced from '@/components/Convinced.vue'
import Footer from '@/components/Footer.vue'
=======
import QuizPanel from '@/components/Quiz/QuizPanel.vue';
>>>>>>> d2f106a543e0a5317ba7e63dacb1b572eb265f1f
</script>

<template>
  <div class="min-h-scree">
    <Header class="fixed top-0 left-0 right-0 z-50 bg-white shadow-md"/>
    <Hero class="mt-20"/>
    <Interests/>
    <Advantages/>
    <SecureInterest/>
    <Convinced/>
    <Footer/>
  </div>
</template>
