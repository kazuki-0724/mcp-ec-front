<script setup>
import CommerceInlineSections from './CommerceInlineSections.vue';

defineProps({
  messages: {
    type: Array,
    required: true
  },
  loadingOrder: {
    type: Boolean,
    default: false
  },
  pendingProductId: {
    type: String,
    default: ''
  }
});

defineEmits(['add-to-cart', 'add-to-wishlist', 'update:orderLookupId', 'load-order']);
</script>

<template>
  <main class="pt-24 pb-64 md:pb-40 px-4 sm:px-6 lg:px-12 max-w-5xl mx-auto flex flex-col gap-6 md:gap-8">
    <div v-for="message in messages" :key="message.id" class="message-row" :class="message.role">
      <div class="message-stack" :class="message.role === 'user' ? 'items-end ml-auto' : 'items-start'">
        <div class="message-bubble" :class="{ loading: message.loading }">
          <template v-if="message.loading">
            <div class="thinking-indicator" role="status" aria-live="polite" aria-label="AIが考え中です">
              <span class="thinking-label">考え中</span>
              <span class="thinking-dots" aria-hidden="true">
                <span></span>
                <span></span>
                <span></span>
              </span>
            </div>
          </template>
          <template v-else>
            {{ message.text }}
          </template>
        </div>

        <CommerceInlineSections
          v-if="message.role === 'ai' && message.inlineCommerce"
          :payload="message.inlineCommerce"
          :loading-order="loadingOrder"
          :pending-product-id="pendingProductId"
          @add-to-cart="$emit('add-to-cart', $event)"
          @add-to-wishlist="$emit('add-to-wishlist', $event)"
          @update:order-lookup-id="$emit('update:orderLookupId', $event)"
          @load-order="$emit('load-order', $event)"
        />
      </div>
    </div>
  </main>
</template>
