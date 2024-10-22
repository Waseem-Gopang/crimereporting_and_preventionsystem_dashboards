function showLoading() {
    document.querySelector('.loading-overlay').style.display = 'block';
    document.querySelector('.loading-spinner').style.display = 'block';
  }
  
  function hideLoading() {
    document.querySelector('.loading-overlay').style.display = 'none';
    document.querySelector('.loading-spinner').style.display = 'none';
  }
  
  
document.getElementById('logoutBtn').addEventListener('click', async () => {
    try {
        showLoading();
        const response = await fetch('/logout', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        const result = await response.json();

        if (result.success) {
            alert('Logged out successfully');
            window.location.href = '/index.html'; // Redirect to login or homepage
        } else {
            alert('Logout failed: ' + result.message);
        }
    } catch (error) {
        alert('An error occurred during logout. Please try again.');
    }finally{
        hideLoading();
    }
});