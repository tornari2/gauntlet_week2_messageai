/**
 * Test Script for Translation Features
 * 
 * This script tests:
 * 1. Language detection
 * 2. Text translation
 * 3. Slang explanation
 * 4. Cultural context
 * 
 * Run with: node test-translation-features.js
 */

// Test different language messages
const testMessages = [
  {
    text: "Hello, how are you?",
    expectedLanguage: "en",
    description: "English message"
  },
  {
    text: "Bonjour, comment allez-vous?",
    expectedLanguage: "fr",
    description: "French message"
  },
  {
    text: "¡Hola! ¿Cómo estás?",
    expectedLanguage: "es",
    description: "Spanish message"
  },
  {
    text: "こんにちは、元気ですか？",
    expectedLanguage: "ja",
    description: "Japanese message"
  },
  {
    text: "Привет, как дела?",
    expectedLanguage: "ru",
    description: "Russian message"
  },
  {
    text: "That's sick! Let's bounce.",
    expectedLanguage: "en",
    description: "English with slang"
  }
];

const CLOUD_FUNCTION_BASE_URL = 'https://us-central1-messageai-42e78.cloudfunctions.net';

// Test language detection
async function testLanguageDetection() {
  console.log('\n========================================');
  console.log('🌍 TESTING LANGUAGE DETECTION');
  console.log('========================================\n');

  for (const testCase of testMessages) {
    try {
      console.log(`Testing: "${testCase.text}"`);
      console.log(`Expected: ${testCase.expectedLanguage}`);
      
      const response = await fetch(`${CLOUD_FUNCTION_BASE_URL}/detectLanguage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: {
            text: testCase.text,
          },
        }),
      });

      if (!response.ok) {
        console.error(`❌ HTTP Error: ${response.status} ${response.statusText}`);
        const errorText = await response.text();
        console.error(`Error details: ${errorText}`);
        continue;
      }

      const result = await response.json();
      const detectedLanguage = result.result.languageCode;
      
      if (detectedLanguage === testCase.expectedLanguage) {
        console.log(`✅ SUCCESS: Detected ${detectedLanguage}`);
      } else {
        console.log(`⚠️  MISMATCH: Detected ${detectedLanguage} (expected ${testCase.expectedLanguage})`);
      }
    } catch (error) {
      console.error(`❌ ERROR: ${error.message}`);
    }
    console.log('');
  }
}

// Test translation
async function testTranslation() {
  console.log('\n========================================');
  console.log('🔄 TESTING TRANSLATION');
  console.log('========================================\n');

  const translationTests = [
    {
      text: "Bonjour, comment allez-vous?",
      sourceLanguage: "fr",
      targetLanguage: "en",
      description: "French to English"
    },
    {
      text: "Hello, how are you?",
      sourceLanguage: "en",
      targetLanguage: "es",
      description: "English to Spanish"
    },
  ];

  for (const testCase of translationTests) {
    try {
      console.log(`Testing: "${testCase.text}"`);
      console.log(`From ${testCase.sourceLanguage} to ${testCase.targetLanguage}`);
      
      const response = await fetch(`${CLOUD_FUNCTION_BASE_URL}/translateText`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: {
            text: testCase.text,
            sourceLanguage: testCase.sourceLanguage,
            targetLanguage: testCase.targetLanguage,
          },
        }),
      });

      if (!response.ok) {
        console.error(`❌ HTTP Error: ${response.status} ${response.statusText}`);
        const errorText = await response.text();
        console.error(`Error details: ${errorText}`);
        continue;
      }

      const result = await response.json();
      const translatedText = result.result.translatedText;
      
      console.log(`✅ Translated: "${translatedText}"`);
    } catch (error) {
      console.error(`❌ ERROR: ${error.message}`);
    }
    console.log('');
  }
}

// Test slang explanation
async function testSlangExplanation() {
  console.log('\n========================================');
  console.log('💬 TESTING SLANG EXPLANATION');
  console.log('========================================\n');

  const slangTest = {
    text: "That's sick! Let's bounce and grab some grub.",
    detectedLanguage: "en"
  };

  try {
    console.log(`Testing: "${slangTest.text}"`);
    
    const response = await fetch(`${CLOUD_FUNCTION_BASE_URL}/explainSlang`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: {
          text: slangTest.text,
          detectedLanguage: slangTest.detectedLanguage,
        },
      }),
    });

    if (!response.ok) {
      console.error(`❌ HTTP Error: ${response.status} ${response.statusText}`);
      const errorText = await response.text();
      console.error(`Error details: ${errorText}`);
      return;
    }

    const result = await response.json();
    const explanations = result.result.explanations;
    
    if (explanations && explanations.length > 0) {
      console.log(`✅ Found ${explanations.length} slang term(s):`);
      explanations.forEach((exp, index) => {
        console.log(`\n${index + 1}. "${exp.term}"`);
        console.log(`   Literal: ${exp.literal}`);
        console.log(`   Meaning: ${exp.meaning}`);
        console.log(`   Example: ${exp.example}`);
      });
    } else {
      console.log('⚠️  No slang terms detected');
    }
  } catch (error) {
    console.error(`❌ ERROR: ${error.message}`);
  }
  console.log('');
}

// Test cultural context
async function testCulturalContext() {
  console.log('\n========================================');
  console.log('🧠 TESTING CULTURAL CONTEXT');
  console.log('========================================\n');

  const culturalTest = {
    text: "Let's meet at 5 PM for afternoon tea",
    detectedLanguage: "en"
  };

  try {
    console.log(`Testing: "${culturalTest.text}"`);
    
    const response = await fetch(`${CLOUD_FUNCTION_BASE_URL}/getCulturalContext`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: {
          text: culturalTest.text,
          detectedLanguage: culturalTest.detectedLanguage,
        },
      }),
    });

    if (!response.ok) {
      console.error(`❌ HTTP Error: ${response.status} ${response.statusText}`);
      const errorText = await response.text();
      console.error(`Error details: ${errorText}`);
      return;
    }

    const result = await response.json();
    const context = result.result;
    
    console.log(`✅ Cultural Insights:`);
    console.log(context.culturalInsights);
    
    if (context.references && context.references.length > 0) {
      console.log(`\nReferences:`);
      context.references.forEach((ref, index) => {
        console.log(`  ${index + 1}. ${ref}`);
      });
    }
  } catch (error) {
    console.error(`❌ ERROR: ${error.message}`);
  }
  console.log('');
}

// Run all tests
async function runAllTests() {
  console.log('╔════════════════════════════════════════╗');
  console.log('║  Translation Features Test Suite      ║');
  console.log('╚════════════════════════════════════════╝');
  
  try {
    await testLanguageDetection();
    await testTranslation();
    await testSlangExplanation();
    await testCulturalContext();
    
    console.log('\n========================================');
    console.log('✅ ALL TESTS COMPLETED');
    console.log('========================================\n');
  } catch (error) {
    console.error('\n❌ TEST SUITE FAILED:', error);
  }
}

// Run tests
runAllTests().catch(console.error);

