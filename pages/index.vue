<template>
  <div class="container">
    <div class="top-bar">
      <h1>スキル分析ツール</h1>
      <NuxtLink to="/admin" class="admin-link">設定 →</NuxtLink>
    </div>

    <div class="current-prompt">
      <span>使用中のプロンプト: <strong>{{ availablePrompts[selectedPromptId]?.name || '読み込み中...' }}</strong></span>
    </div>

    <!-- サンプル選択 -->
    <div class="samples">
      <h3>サンプルテキスト:</h3>
      <div class="sample-buttons">
        <button
          v-for="(sample, index) in samples"
          :key="index"
          @click="loadSample(index)"
          class="sample-btn"
        >
          {{ sample.label }}
        </button>
      </div>
    </div>

    <textarea
      v-model="inputText"
      rows="10"
      placeholder="面接の回答や自己紹介文を入力してください"
    />
    <button @click="analyze" :disabled="loading">
      {{ loading ? '分析中...' : '分析する' }}
    </button>

    <div v-if="result" class="result">
      <h2>分析結果</h2>

      <!-- 総合評価を先頭に表示 -->
      <div v-if="result['総合評価']" class="skill-item overall">
        <span class="skill-name">総合評価</span>
        <span class="score">{{ result['総合評価'] }}点</span>
        <div class="bar">
          <div class="bar-fill" :style="{ width: result['総合評価'] + '%' }"></div>
        </div>
      </div>

      <hr class="divider">

      <div v-for="(score, skill) in result" :key="skill" class="skill-item">
        <span>{{ skill }}</span>
        <span>{{ score }}点</span>
      </div>
    </div>

    <div v-if="error" class="error">{{ error }}</div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

interface AnalysisResult {
  [key: string]: number
}

const samples = [
  {
    label: '高評価',
    text: '前職では営業チームのリーダーを務めていました。最初は目標達成が難しく、自分のアプローチに問題があると気づきました。チームメンバーと1on1を重ね、それぞれの強みを活かせる役割分担を提案したところ、四半期で目標の120%を達成できました。失敗から学ぶことの大切さと、メンバーの意見を聞く姿勢が成長につながったと感じています。今後も新しい技術や手法を積極的に取り入れ、チームに貢献したいです。'
  },
  {
    label: '中評価',
    text: '以前の会社では開発を担当していました。プロジェクトが遅れることもありましたが、仕様変更が多かったのである程度は仕方なかったと思います。チームでの作業は好きですが、時々メンバーとの意見の相違もありました。新しいフレームワークの学習は必要に応じて行っています。今後はもっと効率的に働きたいと考えています。'
  },
  {
    label: '低評価',
    text: '前の会社を辞めたのは、上司が理不尽だったからです。指示が曖昧なのに後から文句を言われることが多く、やる気を失いました。同僚も協力的ではなく、誰も助けてくれませんでした。会社のシステムも古くて使いづらく、改善提案をしても聞き入れてもらえませんでした。正直、今の時代にあの会社のやり方は通用しないと思います。次の職場では、もっとまともな環境で働きたいです。'
  },
  {
    label: '学習意欲高',
    text: '現在、業務と並行してオンラインコースでAI/機械学習を学んでいます。毎朝1時間を学習時間に充て、週末は実際にプロジェクトを作って実践しています。最近はKaggleのコンペにも参加し始めました。わからないことは技術書やドキュメントを読み、コミュニティでも質問しています。昨年はPythonの認定資格も取得しました。常に最新技術をキャッチアップし、会社に還元できるよう心がけています。'
  },
  {
    label: '協調性高',
    text: 'チームプロジェクトでは、まず皆の意見を丁寧に聞くことを心がけています。先日、後輩が提案をためらっていた時、個別に話を聞いて一緒にアイデアを整理し、チーム会議で発表できるようサポートしました。結果的にその提案が採用され、後輩も自信を持てたようです。意見が対立する場面では、双方の考えの共通点を見つけ、win-winの解決策を模索します。誰もが発言しやすい雰囲気作りを大切にしています。'
  },
  {
    label: '他責志向高',
    text: '前のプロジェクトが失敗したのは、企画部門が無茶な要求をしてきたからです。納期も短すぎたし、予算も足りませんでした。マネージャーもサポートしてくれず、クライアントも途中で仕様を変えてきました。開発チームは頑張ったのですが、周りの環境が悪すぎて成功のしようがありませんでした。もっと現実的な条件であれば、良い結果が出せたはずです。'
  }
]


const inputText = ref<string>('')
const result = ref<AnalysisResult | null>(null)
const loading = ref<boolean>(false)
const error = ref<string>('')
const selectedPromptId = ref('detailed')
const availablePrompts = ref<Record<string, any>>({})

function loadSample(index: number) {
  inputText.value = samples[index].text
  result.value = null
  error.value = ''
}

async function loadPrompts() {
  try {
    const data = await $fetch('/api/prompts/list')
    availablePrompts.value = data.prompts

    // LocalStorageから設定を読み込む
    const saved = localStorage.getItem('defaultPromptId')
    if (saved && availablePrompts.value[saved]) {
      selectedPromptId.value = saved
    }
  } catch (error) {
    console.error('Failed to load prompts:', error)
  }
}

const analyze = async (): Promise<void> => {
  if (!inputText.value.trim()) {
    error.value = 'テキストを入力してください'
    return
  }

  loading.value = true
  error.value = ''
  result.value = null

  try {
    const data = await $fetch<AnalysisResult>('/api/analyze', {
      method: 'POST',
      body: {
        text: inputText.value,
        promptId: selectedPromptId.value
      }
    })
    result.value = data as Record<string, number>
  } catch (e) {
    console.error('分析エラー:', e)
    error.value = '分析に失敗しました'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadPrompts()
})
</script>

<style scoped>
.container {
  max-width: 800px;
  margin: 50px auto;
  padding: 20px;
}

textarea {
  width: 100%;
  padding: 10px;
  margin: 20px 0;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-family: inherit;
}

button {
  padding: 10px 20px;
  background: #0070f3;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
}

button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

button:hover:not(:disabled) {
  background: #0056b3;
}

/* style に追加 */
.skill-item.overall {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 20px;
  margin-bottom: 20px;
}
.skill-item.overall .skill-name {
  font-size: 20px;
  font-weight: bold;
}
.skill-item.overall .score {
  color: white;
  font-size: 24px;
}
.skill-item.overall .bar {
  background: rgba(255, 255, 255, 0.3);
}
.skill-item.overall .bar-fill {
  background: white;
}
.divider {
  border: none;
  border-top: 2px solid #ddd;
  margin: 20px 0;
}
.skill-name {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
}

.result {
  margin-top: 30px;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 20px;
}

.skill-item {
  display: flex;
  justify-content: space-between;
  padding: 10px;
  border-bottom: 1px solid #eee;
}

.skill-item:last-child {
  border-bottom: none;
}

.error {
  color: red;
  margin-top: 20px;
  padding: 10px;
  background-color: #fee;
  border: 1px solid #fcc;
  border-radius: 4px;
}

.top-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.admin-link {
  color: #0070f3;
  text-decoration: none;
  font-weight: bold;
}

.admin-link:hover {
  text-decoration: underline;
}

.current-prompt {
  padding: 12px;
  background: #f0f7ff;
  border-left: 4px solid #0070f3;
  border-radius: 4px;
  margin-bottom: 20px;
  color: #333;
  font-size: 14px;
}

.current-prompt strong {
  color: #0070f3;
}
</style>
