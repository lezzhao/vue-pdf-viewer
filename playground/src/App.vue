<script setup lang="ts">
import PdfViewer from "../../src/components/index.vue";
</script>

<template>
  <PdfViewer :source="{
    url: 'https://static13.eeo.im/upload/trans/main01/c3/e9/2105528/noop/2F_f8952756-1b73-4da0-b160-ea924339ac57.pdf',
  }" />
</template>


<style lang="less">
.a {
  color: red;
}
</style>