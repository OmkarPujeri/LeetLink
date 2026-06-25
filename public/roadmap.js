// roadmap.js

const roadmapContainer = document.getElementById('roadmapContainer');
const roadmapTabs = document.getElementById('roadmapTabs');
const progressText = document.getElementById('progressText');
const loginBtn = document.getElementById('loginBtn');
const logoutBtn = document.getElementById('logoutBtn');
const userGreeting = document.getElementById('userGreeting');

// In a real app, this would be fetched from the backend or a JSON file
const problemDatabase = [
    { id: '1', title: 'Two Sum', difficulty: 'Easy', category: 'beginner', topic: 'Arrays', company: 'Google', youtube: 'https://youtube.com/watch?v=KLlXCFG5TnA' },
    { id: '2', title: 'Contains Duplicate', difficulty: 'Easy', category: 'beginner', topic: 'Arrays', company: 'Meta', youtube: 'https://youtube.com/watch?v=3OamzN90kPg' },
    { id: '3', title: 'Merge Intervals', difficulty: 'Medium', category: 'advanced', topic: 'Intervals', company: 'Google', youtube: 'https://youtube.com/watch?v=44H3cEC2fFM' },
    { id: '4', title: 'Sliding Window Maximum', difficulty: 'Hard', category: 'advanced', topic: 'Sliding Window', company: 'Amazon', youtube: 'https://youtube.com/watch?v=DfljaUwZsOk' },
    { id: '5', title: 'Valid Parentheses', difficulty: 'Easy', category: 'beginner', topic: 'Stacks', company: 'Meta', youtube: 'https://youtube.com/watch?v=WTzjTskDFMg' },
    { id: '6', title: 'Longest Substring Without Repeating Characters', difficulty: 'Medium', category: 'advanced', topic: 'Sliding Window', company: 'Amazon', youtube: 'https://youtube.com/watch?v=wiGpQwKPb1g' }
];

let completedProblems = new Set();
let currentTab = 'beginner';
let isAuthenticated = false;

// 1. Check Auth Status on Load
async function checkAuth() {
    try {
        const response = await fetch('/api/me');
        if (response.ok) {
            const data = await response.json();
            isAuthenticated = true;
            loginBtn.style.display = 'none';
            logoutBtn.style.display = 'inline-flex';
            userGreeting.style.display = 'inline-block';
            userGreeting.textContent = `Hello, ${data.displayName}`;
            
            // If authenticated, fetch their progress from DB
            await fetchUserProgress();
        } else {
            // Not authenticated, load from localStorage
            loadLocalProgress();
        }
    } catch (e) {
        console.error('Failed to check auth status', e);
        loadLocalProgress();
    }
    renderRoadmap();
}

function loadLocalProgress() {
    const saved = localStorage.getItem('leetlink_completed');
    if (saved) {
        try {
            completedProblems = new Set(JSON.parse(saved));
        } catch (e) {}
    }
}

async function fetchUserProgress() {
    try {
        const res = await fetch('/api/user/progress');
        if (res.ok) {
            const data = await res.json();
            completedProblems = new Set(data.completedProblems || []);
        }
    } catch (e) {
        console.error('Error fetching progress', e);
    }
}

async function toggleComplete(id) {
    if (completedProblems.has(id)) {
        completedProblems.delete(id);
    } else {
        completedProblems.add(id);
    }
    
    // Optimistic UI update
    renderRoadmap();

    // Persist
    if (isAuthenticated) {
        try {
            await fetch('/api/user/progress', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ completedProblems: Array.from(completedProblems) })
            });
        } catch (e) {
            console.error('Error saving progress to backend', e);
        }
    } else {
        localStorage.setItem('leetlink_completed', JSON.stringify(Array.from(completedProblems)));
    }
}

function getFilteredProblems() {
    if (currentTab === 'beginner' || currentTab === 'advanced') {
        return problemDatabase.filter(p => p.category === currentTab);
    }
    // For 'company' or 'topic', we sort them by that attribute
    let sorted = [...problemDatabase];
    if (currentTab === 'company') {
        sorted.sort((a, b) => a.company.localeCompare(b.company));
    } else if (currentTab === 'topic') {
        sorted.sort((a, b) => a.topic.localeCompare(b.topic));
    }
    return sorted;
}

function renderRoadmap() {
    const problems = getFilteredProblems();
    roadmapContainer.innerHTML = '';

    if (problems.length === 0) {
        roadmapContainer.innerHTML = '<div class="body-text" style="color: var(--colors-slate);">No problems found.</div>';
    }

    let completedCount = 0;
    const totalCount = problemDatabase.length;

    problems.forEach(p => {
        const isCompleted = completedProblems.has(p.id);
        if (isCompleted) completedCount++;

        const item = document.createElement('div');
        item.className = 'roadmap-item';
        
        // Build the HTML structure
        item.innerHTML = `
            <div class="roadmap-item-info">
                <div class="roadmap-item-title heading-sm">${p.title}</div>
                <div class="roadmap-item-tags">
                    <span class="roadmap-tag" style="color: ${p.difficulty==='Easy'?'#166534':p.difficulty==='Medium'?'#9a3412':'#991b1b'}">${p.difficulty}</span>
                    <span class="roadmap-tag">${p.topic}</span>
                    <span class="roadmap-tag">${p.company}</span>
                </div>
            </div>
            <div class="roadmap-item-actions">
                ${p.youtube ? `<a href="${p.youtube}" target="_blank" class="youtube-link micro-caps">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M21.582,6.186c-0.23-0.86-0.908-1.538-1.768-1.768C18.254,4,12,4,12,4S5.746,4,4.186,4.418c-0.86,0.23-1.538,0.908-1.768,1.768 C2,7.746,2,12,2,12s0,4.254,0.418,5.814c0.23,0.86,0.908,1.538,1.768,1.768C5.746,20,12,20,12,20s6.254,0,7.814-0.418 c0.86-0.23,1.538-0.908,1.768-1.768C22,16.254,22,12,22,12S22,7.746,21.582,6.186z M9.996,15.005l0-6.01L15.224,12L9.996,15.005z"/></svg>
                    Watch Solution
                </a>` : ''}
                <button class="toggle-complete ${isCompleted ? 'completed' : ''}" aria-label="Toggle completion" data-id="${p.id}">
                    ${isCompleted ? '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>' : ''}
                </button>
            </div>
        `;
        roadmapContainer.appendChild(item);
    });

    // We count global completion across the entire database
    let totalCompleted = 0;
    problemDatabase.forEach(p => {
        if (completedProblems.has(p.id)) totalCompleted++;
    });
    progressText.textContent = `Progress: ${totalCompleted}/${totalCount} completed`;
    
    // Add event listeners to toggle buttons
    document.querySelectorAll('.toggle-complete').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.currentTarget.getAttribute('data-id');
            toggleComplete(id);
        });
    });
}

// Tab Switching
roadmapTabs.addEventListener('click', (e) => {
    if (e.target.classList.contains('roadmap-tab')) {
        document.querySelectorAll('.roadmap-tab').forEach(t => t.classList.remove('active'));
        e.target.classList.add('active');
        currentTab = e.target.getAttribute('data-tab');
        renderRoadmap();
    }
});

// Initialize
checkAuth();
