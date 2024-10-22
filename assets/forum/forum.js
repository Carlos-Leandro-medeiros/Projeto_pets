const API_URL = 'http://localhost:3002'; // URL do JSON Server

// Função para armazenar dados no LocalStorage
function setLocalStorage(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
}

// Função para obter dados do LocalStorage
function getLocalStorage(key) {
    return JSON.parse(localStorage.getItem(key));
}

// Função para registrar um novo usuário
// document.getElementById('register-form')?.addEventListener('submit', function (e) {
//     e.preventDefault();

//     const fullName = document.getElementById('register-fullname').value;
//     const email = document.getElementById('register-email').value;
//     const password = document.getElementById('register-password').value;
//     const confirmPassword = document.getElementById('register-confirm-password').value;

//     if (password !== confirmPassword) {
//         alert('As senhas não coincidem.');
//         return;
//     }

//     const user = {
//         fullName,
//         email,
//         password
//     };

//     fetch(`${API_URL}/users`, {
//         method: 'POST',
//         headers: {
//             'Content-Type': 'application/json'
//         },
//         body: JSON.stringify(user)
//     })
//         .then(response => response.json())
//         .then(data => {
//             alert('Usuário registrado com sucesso!');
//             window.location.href = 'index.html';
//         })
//         .catch(error => {
//             console.error('Erro ao registrar usuário:', error);
//             alert('Erro ao registrar usuário.');
//         });
// });

// Função para autenticar um usuário
// document.getElementById('loginForm').addEventListener('submit', function (e) {
//     e.preventDefault();

//     const email = document.getElementById('email').value;
//     const password = document.getElementById('senha').value;

//     firebase.auth().signInWithEmailAndPassword(email, password)
//         .then((userCredential) => {
//             const user = userCredential.user;
//             console.log('Usuário logado:', user);
//             alert('Login realizado com sucesso!');
//             window.location.href = 'account.html';
//         })
//         .catch((error) => {
//             console.error('Erro ao fazer login:', error);
//             alert('Email ou senha incorretos.');
//         });
// });

// Função para deslogar um usuário
// document.getElementById('logout')?.addEventListener('click', function () {
//     localStorage.removeItem('user');
//     alert('Logout realizado com sucesso!');
//     window.location.href = 'index.html';
// });

// Função para carregar postagens
function loadPosts() {
    fetch(`${API_URL}/posts`)
        .then(response => response.json())
        .then(posts => {
            const postsContainer = document.getElementById('posts-container');
            postsContainer.innerHTML = '';
            posts.forEach(post => {
                const postElement = createPostElement(post);
                postsContainer.prepend(postElement);
            });
        })
        .catch(error => {
            console.error('Erro ao carregar postagens:', error);
        });
}

// Função para criar um novo post
document.getElementById('post-form')?.addEventListener('submit', function (e) {
    e.preventDefault();

    const user = getLocalStorage('user');
    const content = document.getElementById('post-content').value;

    const newPost = {
        content,
        userId: user.id,
        authorName: user.fullName,
        likes: 0,
        comments: [],
        likedBy: [],
        commentedBy: []
    };

    fetch(`${API_URL}/posts`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(newPost)
    })
        .then(response => response.json())
        .then(data => {
            alert('Post criado com sucesso!');
            document.getElementById('post-content').value = ''; // Limpa o campo de texto
            loadPosts(); // Recarrega as postagens para incluir o novo post
        })
        .catch(error => {
            console.error('Erro ao criar post:', error);
            alert('Erro ao criar post.');
        });
});

// Função para criar um novo elemento de postagem
function createPostElement(post) {
    const postElement = document.createElement('div');
    postElement.className = 'post';
    postElement.dataset.id = post.id;

    const postContent = document.createElement('p');
    postContent.textContent = post.content;
    postElement.appendChild(postContent);

    const postAuthor = document.createElement('p');
    postAuthor.textContent = `Postado por: ${post.authorName}`;
    postElement.appendChild(postAuthor);

    const actionsContainer = document.createElement('div');
    actionsContainer.className = 'actions';

    const likeButton = document.createElement('button');
    likeButton.textContent = `Curtir (${post.likes || 0})`;
    likeButton.addEventListener('click', () => likePost(post));
    actionsContainer.appendChild(likeButton);

    const commentButton = document.createElement('button');
    commentButton.textContent = 'Comentar';
    commentButton.addEventListener('click', () => showCommentInput(postElement));
    actionsContainer.appendChild(commentButton);

    const user = getLocalStorage('user');
    if (user && user.id === post.userId) {
        const editButton = document.createElement('button');
        editButton.textContent = 'Editar';
        editButton.addEventListener('click', () => editPost(post));
        actionsContainer.appendChild(editButton);

        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'Excluir';
        deleteButton.addEventListener('click', () => deletePost(post.id));
        actionsContainer.appendChild(deleteButton);
    }

    postElement.appendChild(actionsContainer);

    // Carrega os comentários
    loadComments(post.id, postElement);

    return postElement;
}

// Função para curtir uma postagem
function likePost(post) {
    const user = getLocalStorage('user');
    if (!post.likedBy.includes(user.id)) {
        post.likedBy.push(user.id);
        fetch(`${API_URL}/posts/${post.id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(post)
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Erro ao curtir postagem');
                }
                return response.json();
            })
            .then(data => {
                const likeButton = document.querySelector(`.post[data-id="${post.id}"] .actions button:first-child`);
                likeButton.textContent = `Curtir (${data.likedBy.length})`;
                likeButton.disabled = true;
            })
            .catch(error => {
                console.error('Erro ao curtir postagem:', error);
                alert('Erro ao curtir postagem.');
            });
    } else {
        alert('Você já curtiu esta postagem.');
    }
}


// Função para mostrar o campo de comentário
function showCommentInput(postElement) {
    const commentInput = document.createElement('textarea');
    commentInput.placeholder = 'Digite seu comentário';
    commentInput.className = 'comment-input';
    postElement.appendChild(commentInput);

    const commentButton = document.createElement('button');
    commentButton.textContent = 'Comentar';
    commentButton.addEventListener('click', () => addComment(postElement, commentInput.value));
    postElement.appendChild(commentButton);
}

// Função para adicionar um comentário
function addComment(postElement, commentContent) {
    const user = getLocalStorage('user');
    const postId = postElement.dataset.id;
    const comment = {
        userId: user.id,
        postId: postId,
        content: commentContent,
        authorName: user.fullName // Adiciona o nome do autor do comentário
    };

    fetch(`${API_URL}/comments`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(comment)
    })
        .then(response => response.json())
        .then(data => {
            const commentElement = document.createElement('div');
            commentElement.className = 'comment';
            commentElement.textContent = `${user.fullName}: ${data.content}`;
            postElement.querySelector('.comments').appendChild(commentElement);

            const commentInput = postElement.querySelector('textarea');
            const commentButton = postElement.querySelector('button');
            commentInput.remove();
            commentButton.remove();
        })
        .catch(error => {
            console.error('Erro ao adicionar comentário:', error);
            alert('Erro ao adicionar comentário.');
        });
}

// Função para carregar comentários
function loadComments(postId, postElement) {
    fetch(`${API_URL}/comments?postId=${postId}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Not Found');
            }
            return response.json();
        })
        .then(comments => {
            const commentsContainer = document.createElement('div');
            commentsContainer.className = 'comments';
            comments.forEach(comment => {
                const commentElement = document.createElement('div');
                commentElement.className = 'comment';
                commentElement.textContent = `${comment.authorName}: ${comment.content}`;
                commentsContainer.appendChild(commentElement);
            });
            postElement.appendChild(commentsContainer);
        })
        .catch(error => {
            console.error('Erro ao carregar comentários:', error);
        });
}

// Função para editar uma postagem
function editPost(post) {
    const newContent = prompt('Digite o novo conteúdo da postagem:', post.content);
    if (newContent) {
        post.content = newContent;
        fetch(`${API_URL}/posts/${post.id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(post)
        })
            .then(response => response.json())
            .then(data => {
                alert('Post editado com sucesso!');
                loadPosts(); // Recarrega as postagens para mostrar o post editado
            })
            .catch(error => {
                console.error('Erro ao editar post:', error);
                alert('Erro ao editar post.');
            });
    }
}

// Função para excluir uma postagem
function deletePost(postId) {
    if (confirm('Tem certeza que deseja excluir esta postagem?')) {
        fetch(`${API_URL}/posts/${postId}`, {
            method: 'DELETE'
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Erro ao excluir postagem');
                }
                alert('Postagem excluída com sucesso!');
                loadPosts(); // Recarrega as postagens para atualizar a lista
            })
            .catch(error => {
                console.error('Erro ao excluir postagem:', error);
                alert('Erro ao excluir postagem.');
            });
    }
}

// Carrega as postagens ao carregar a página
window.onload = function () {
    loadPosts();
};

//Header -> menu sanduíche
function showSidebar() {
    const sidebar = document.querySelector('.sidebar');

    sidebar.style.display = 'flex';
}

function hideSiderbar() {
    const sidebar = document.querySelector('.sidebar');

    sidebar.style.display = 'none';
}
//fim do header