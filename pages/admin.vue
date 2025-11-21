<template>
  <div class="admin-container">
    <div class="header">
      <h1>プロンプト管理</h1>
      <NuxtLink to="/" class="back-link">← 分析画面に戻る</NuxtLink>
    </div>

    <div class="content">
      <section class="section">
        <h2>利用可能なプロンプト</h2>
        <p class="info">デフォルトで使用するプロンプトを選択してください</p>

        <div class="prompt-list">
          <div
            v-for="(prompt, id) in prompts"
            :key="id"
            class="prompt-card"
            :class="{ selected: selectedId === id }"
            @click="selectPrompt(id)"
          >
            <div class="radio">
              <input
                type="radio"
                :id="id"
                :value="id"
                v-model="selectedId"
              />
            </div>
            <div class="prompt-info">
              <h3>{{ prompt.name }}</h3>
              <p class="description">{{ prompt.description }}</p>
              <button @click.stop="viewPrompt(id, prompt)" class="btn-view">
                プロンプトを表示
              </button>
            </div>
          </div>
        </div>

        <div class="save-section">
          <button @click="saveDefault" class="btn-save" :disabled="saving">
            {{ saving ? '保存中...' : 'デフォルトに設定' }}
          </button>
          <p class="note">※この設定はブラウザに保存されます</p>
        </div>
      </section>
    </div>

    <!-- プロンプト表示モーダル -->
    <div v-if="showModal" class="modal-overlay" @click="closeModal">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h2>{{ viewingPrompt.name }}</h2>
          <button @click="closeModal" class="btn-close">×</button>
        </div>
        <div class="modal-body">
          <p class="description">{{ viewingPrompt.description }}</p>
          <pre class="prompt-content">{{ viewingPrompt.prompt }}</pre>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const prompts = ref<Record<string, any>>({})
const selectedId = ref('detailed')
const saving = ref(false)
const showModal = ref(false)
const viewingPrompt = ref({ name: '', description: '', prompt: '' })

// プロンプト一覧取得
async function loadPrompts() {
  try {
    const data = await $fetch('/api/prompts/list')
    prompts.value = data.prompts

    // LocalStorageから設定を読み込む
    const saved = localStorage.getItem('defaultPromptId')
    if (saved && prompts.value[saved]) {
      selectedId.value = saved
    }
  } catch (error) {
    console.error('Failed to load prompts:', error)
  }
}

// プロンプト選択
function selectPrompt(id: string) {
  selectedId.value = id
}

// デフォルトに設定
function saveDefault() {
  saving.value = true

  try {
    localStorage.setItem('defaultPromptId', selectedId.value)
    alert('デフォルトプロンプトを設定しました')
  } catch (error) {
    alert('保存に失敗しました')
  } finally {
    saving.value = false
  }
}

// プロンプト表示
function viewPrompt(id: string, prompt: any) {
  viewingPrompt.value = prompt
  showModal.value = true
}

function closeModal() {
  showModal.value = false
}

onMounted(() => {
  loadPrompts()
})
</script>

<style scoped>
.admin-container {
  max-width: 900px;
  margin: 0 auto;
  padding: 40px 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 40px;
}

.header h1 {
  margin: 0;
  color: #333;
}

.back-link {
  color: #0070f3;
  text-decoration: none;
}

.back-link:hover {
  text-decoration: underline;
}

.section h2 {
  color: #333;
  margin-bottom: 10px;
}

.info {
  color: #666;
  margin-bottom: 30px;
}

.prompt-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
  margin-bottom: 30px;
}

.prompt-card {
  display: flex;
  gap: 15px;
  padding: 20px;
  border: 2px solid #ddd;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  background: white;
}

.prompt-card:hover {
  border-color: #0070f3;
  box-shadow: 0 2px 8px rgba(0, 112, 243, 0.1);
}

.prompt-card.selected {
  border-color: #0070f3;
  background: #f0f7ff;
}

.radio {
  display: flex;
  align-items: flex-start;
  padding-top: 5px;
}

.radio input {
  width: 20px;
  height: 20px;
  cursor: pointer;
}

.prompt-info {
  flex: 1;
}

.prompt-info h3 {
  margin: 0 0 8px 0;
  color: #333;
}

.description {
  color: #666;
  font-size: 14px;
  margin-bottom: 12px;
}

.btn-view {
  padding: 6px 12px;
  background: #eee;
  color: #333;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
}

.btn-view:hover {
  background: #ddd;
}

.save-section {
  text-align: center;
  padding: 30px 0;
  border-top: 2px solid #eee;
}

.btn-save {
  padding: 12px 40px;
  background: #0070f3;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
  font-weight: bold;
}

.btn-save:hover:not(:disabled) {
  background: #0051cc;
}

.btn-save:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.note {
  margin-top: 10px;
  color: #999;
  font-size: 13px;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 800px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #ddd;
}

.modal-header h2 {
  margin: 0;
}

.btn-close {
  background: none;
  border: none;
  font-size: 32px;
  cursor: pointer;
  color: #999;
  line-height: 1;
}

.btn-close:hover {
  color: #333;
}

.modal-body {
  padding: 20px;
  overflow-y: auto;
}

.modal-body .description {
  margin-bottom: 20px;
  padding: 15px;
  background: #f9f9f9;
  border-radius: 6px;
}

.prompt-content {
  background: #f5f5f5;
  padding: 20px;
  border-radius: 6px;
  white-space: pre-wrap;
  font-family: monospace;
  font-size: 13px;
  line-height: 1.6;
  overflow-x: auto;
}
</style>
