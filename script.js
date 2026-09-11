function switchTab(tabId) {
    // Hide all contents
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });

    // Deactivate all buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('bg-blue-600', 'text-white');
        btn.classList.add('text-slate-400');
    });

    // Show target content
    document.getElementById(tabId).classList.add('active');

    // Activate target button
    const activeBtn = document.getElementById('btn-' + tabId);
    activeBtn.classList.add('bg-blue-600', 'text-white');
    activeBtn.classList.remove('text-slate-400');

    // Scroll to top of tab smoothly
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Add some console fun for an AI Researcher
console.log("%c SYSTEM: Minh Sang Profile Initialized", "color: #3b82f6; font-weight: bold; font-size: 14px;");
console.log("Status: Ready to explore AI at UIT.");
