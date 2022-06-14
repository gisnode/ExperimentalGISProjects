<template>
  <div id="approot">
    <button>Images Dir</button>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ref } from '@vue/reactivity';
import './App.scss';

export default defineComponent({
  setup() {
    const imagesdir = ref('');
    const csvpath = ref('');
    const targetdir = ref('');

    return {
      imagesdir, csvpath, targetdir
    }

  },
})
</script>
