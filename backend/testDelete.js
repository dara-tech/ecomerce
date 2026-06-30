import axios from 'axios';

async function testDelete() {
  try {
    // 1. Login
    const res = await axios.post('http://127.0.0.1:5001/api/auth/login', {
      email: 'admin@admin.com',
      password: 'password'
    });
    const token = res.data.token;
    console.log('Logged in, got token:', token.substring(0, 20) + '...');

    // 2. Get banners
    const getRes = await axios.get('http://127.0.0.1:5001/api/cms/banners');
    const banners = getRes.data;
    console.log('Got banners:', banners.length);

    if (banners.length > 0) {
      const idToDelete = banners[0]._id;
      console.log('Attempting to delete banner:', idToDelete);

      // 3. Delete banner
      const delRes = await axios.delete(`http://127.0.0.1:5001/api/cms/banners/${idToDelete}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      console.log('Delete response:', delRes.status, delRes.data);
    } else {
      console.log('No banners to delete.');
    }
  } catch (err) {
    console.error('Error:', err.response ? err.response.data : err.message);
  }
}

testDelete();
