
// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-analytics.js";
import { getAuth, signInWithEmailAndPassword, GoogleAuthProvider, signInWithRedirect, getRedirectResult,  browserSessionPersistence, setPersistence, signOut, deleteUser, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, collection, getDocs , runTransaction ,query , deleteDoc, where, writeBatch} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// https://firebase.google.com/docs/web/setup#available-libraries

const firebaseConfig = {
    apiKey: "AIzaSyDW2O3ACNWUa-eYaSAJ8d29Dd49NlMgZG4",
    authDomain: "spendwise-f788d.firebaseapp.com",
    projectId: "spendwise-f788d",
    storageBucket: "spendwise-f788d.appspot.com",
    messagingSenderId: "156549343863",
    appId: "1:156549343863:web:7cd3b36ff95d0f70b13472",
    measurementId: "G-LF7GDG3EKB"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const firestore = getFirestore(app);
const provider = new GoogleAuthProvider();


setPersistence(auth, browserSessionPersistence).then(a => {
});
onAuthStateChanged(auth, (user) => {
    console.log("Change", user != null)
    toggleDeletionActions(false)
});
function handleLoginForm(formId) {
    showLoading()
    const formData = $(formId).serializeArray();
    const formObject = {};
    formData.forEach((field) => {
        formObject[field.name] = field.value;
    });
    signInWithEmailAndPassword(auth,formObject.email, formObject.password,)
        .then((userCredential) => {
            closeLoading()
            showAlertModal("Login Successfully", "success");
            toggleDeletionActions(true);
        })
        .catch((error) => {
            showAlertModal("Login Failed:"+error.message, "success");
            console.error("Authentication error:", error.message);
        }).finally(()=>{
            closeLoading()
    });
}

function signInWithGoogle(){
    showLoading()
    signInWithRedirect(auth, provider).then(r => {});
    closeLoading()
}

getRedirectResult(auth)
    .then((result) => {
        if(result ){
            showAlertModal("Login Successfully with google", "success");
            toggleDeletionActions(true)
        }else{
        }
    }).catch((error) => {
    console.error("Google login",error)
});


function toggleDeletionActions(visible){
    const user = auth.currentUser;
    let  profileImage = null ;
    if(user && user.photoURL){
        profileImage = user.photoURL
    }else{
        profileImage =  'https://www.gravatar.com/avatar/?d=identicon';
    }
    if (user) {
        $('#id_connected_as').text(`( Not connected )`)
        $('#deleteSpendWise').attr('data-bs-target', '#staticBackdrop')
        $('#logoutSpendWise').off('click')
        $('#deleteAll').off('click');
        $('#deletionSpendWise').remove()
        $('#logoutSpendWise').remove()

        const user = auth.currentUser;
        const profileImage = user.photoURL;
        // Create the modal HTML structure dynamically
        $('#id_connected_as').text(`(Connected as ${user.displayName || user.email} )`)
        const modalContent = `
                <div class="modal fade" id="deletionSpendWise" data-bs-backdrop="static" data-bs-keyboard="false" tabindex="-1" aria-labelledby="deletionSpendWiseLabel" aria-hidden="true">
                    <div class="modal-dialog modal-dialog-centered modal-lg">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title" id="others">Account deletion</h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                            </div>
                            <div class="modal-body">
                                <div id="connected_as" class="d-flex align-items-center flex-column">
                                    <img src="${profileImage}" alt="Profile Image" id="connected_as_img" class="rounded-5" width="50" height="50">
                                    <div>Your are connected as ${user.displayName || user.email}</div>

                                    <div class="alert alert-danger mt-2" role="alert">
                                        <h4 class="alert-heading">Warning: Account Deletion</h4>
                                        <p>Are you sure you want to delete your account? This action is irreversible and will permanently erase all your account data, including settings, preferences, and transaction history.</p>
                                        <hr>
                                        <p class="mb-0">This process cannot be undone. Please consider the consequences carefully. If you proceed, your account and data will be deleted permanently. If you have any concerns or need assistance, contact our support team.</p>
                                    </div>

                                    <button class="btn btn-danger my-3" id="deleteAll" ><i class="fa fa-trash mx-2" ></i> Delete my account and all data</button>

                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        const logoutContent =`
        <a class="text-decoration-none btn  d-flex align-items-center p-2 m-3" id="logoutSpendWise">
                        <i class="fa fa-sign-out text-warning mx-2"></i>
                        <div class="flex-grow-1 " style="text-align: left">
                            Logout
                        </div>
                        <i class="fa fa-arrow-right"> </i>
                    </a>`;

        // Append the modal HTML to the body
        $('body').append(modalContent);
        $('#spendwise_accordion_body').append(logoutContent);
        $("#staticBackdrop").modal('hide')
        $('#deleteSpendWise').attr('data-bs-target', '#deletionSpendWise')
        $('#logoutSpendWise').on('click',  function (event) {
            event.preventDefault();
            logout()
        });
        $('#deleteAll').on('click',  async function (event) {
            event.preventDefault();
            await deleteData()
        });
        if(visible){
            $('#deletionSpendWise').modal('show');
        }

    }else{
        $('#id_connected_as').text(`( Not connected )`)
        $('#deleteSpendWise').attr('data-bs-target', '#staticBackdrop')
        $('#logoutSpendWise').off('click')
        $('#deleteAll').off('click');
        $('#deletionSpendWise').remove()
        $('#logoutSpendWise').remove()
    }
    closeLoading()
}


function logout(){
    showLoading()
    signOut(auth).then(() => {
        showAlertModal("Logout Successfully", "success");
    }).catch((error) => {
        showAlertModal("Cannot logout", "error")
    }).finally(()=>{
        closeLoading()
    });
}

async function deleteData() {
    $('#deletionSpendWise').modal('hide');
    showLoading()
    try {
        if(auth.currentUser){
            await runTransaction(firestore, async (transaction) => {
                const batch = writeBatch(firestore);
                await deleteUserDataInCollection(batch, "spends", "userId", auth.currentUser.uid);
                await deleteUserDataInCollection(batch, "categories", "userId", auth.currentUser.uid);
                await deleteUserDataInCollection(batch, "settings", "userId", auth.currentUser.uid);
                await batch.commit();
                await deleteCurrentUser()
            });
        }
        showAlertModal("Account and data deleted", "success")
        toggleDeletionActions();
        console.log("Transaction successfully committed!");
    } catch (e) {
        showAlertModal("Cannot delete account or data", "error")
    } finally {
        closeLoading()
    }
}

async function deleteUserDataInCollection(batch,collectionName, userField, userUid) {
    const q = query(collection(firestore, collectionName), where(userField, "==", userUid));
    //print docs
    try {
        const querySnapshot = await getDocs(q);
        // Log the documents
        querySnapshot.forEach((doc) => {
            batch.delete(doc.ref);
        });
    } catch (error) {
        console.error("Error getting documents:", error.message);
    }
}

async function deleteCurrentUser() {
    await deleteUser(auth.currentUser);
}


function showLoading() {
    $('#loadingModal').modal('show');
}

function closeLoading() {
    $('#loadingModal').modal('hide');
}

function showAlertModal(message, status) {
    const alertModal = $('#alertModal');
    const alertMessage = $('#alertMessage');

    // Set modal content based on status
    alertModal.removeClass('modal-success modal-error');
    alertModal.addClass(status === 'success' ? 'modal-success' : 'modal-error');
    alertMessage.text(message);

    // Show the alert modal
    alertModal.one('hidden.bs.modal', function () {
        closeLoading();
    }).modal('show');
}





$(document).ready(function () {
    $("#spendwise_login").on('submit', function (event) {
        event.preventDefault();
        grecaptcha.ready(function() {
            grecaptcha.execute('6LcA3DopAAAAAEu6_PFS8Ie5AdCe3e9_HQ10m4lI', {action: 'submit'}).then(function(token) {
                handleLoginForm("#spendwise_login");
            });
        });

    });

    $("#spendwise_login_google").on('click', function (event) {
        event.preventDefault();
        grecaptcha.ready(function() {
            grecaptcha.execute('6LcA3DopAAAAAEu6_PFS8Ie5AdCe3e9_HQ10m4lI', {action: 'submit'}).then(function(token) {
                signInWithGoogle();
            });
        });

    });

    $('#alertModal').on('hidden.bs.modal', function () {
        $(this).removeClass('modal-success modal-error');
    });

    if(window.location.hash){
        $(window.location.hash).modal('show')
    }

});
