import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useContext, useEffect, useState, useCallback } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    KeyboardAvoidingView,
    Modal,
    Platform,
    RefreshControl,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { communityAPI } from '../services/api';

const FLAIR_OPTIONS = [
    { key: 'general', label: 'General', color: '#607D8B', icon: '💬' },
    { key: 'recruitment', label: 'Recruitment Drive', color: '#E91E63', icon: '📢' },
    { key: 'beach_event', label: 'Beach Event', color: '#FF9800', icon: '🏖️' },
    { key: 'cleanup', label: 'Cleanup Drive', color: '#4CAF50', icon: '♻️' },
    { key: 'alert', label: 'Alert/Warning', color: '#F44336', icon: '⚠️' },
    { key: 'question', label: 'Question', color: '#9C27B0', icon: '❓' },
];

const getFlairInfo = (key) => FLAIR_OPTIONS.find(f => f.key === key) || FLAIR_OPTIONS[0];

const timeAgo = (dateStr) => {
    const now = new Date();
    const date = new Date(dateStr);
    const seconds = Math.floor((now - date) / 1000);
    if (seconds < 60) return 'just now';
    const mins = Math.floor(seconds / 60);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
};

export default function CommunityScreen({ navigation }) {
    const { user } = useContext(AuthContext);

    // Feed state
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [fetchError, setFetchError] = useState(null);

    // Create post modal
    const [showCreate, setShowCreate] = useState(false);
    const [newContent, setNewContent] = useState('');
    const [newFlair, setNewFlair] = useState('general');
    const [creating, setCreating] = useState(false);
    const [selectedImages, setSelectedImages] = useState([]);

    // Post detail modal
    const [selectedPost, setSelectedPost] = useState(null);
    const [postDetail, setPostDetail] = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [commentText, setCommentText] = useState('');
    const [replyingTo, setReplyingTo] = useState(null); // { id, name }
    const [submittingComment, setSubmittingComment] = useState(false);

    // Load posts
    const loadPosts = useCallback(async (pageNum = 1, append = false) => {
        try {
            if (pageNum === 1) { setLoading(true); setFetchError(null); }
            else setLoadingMore(true);

            const data = await communityAPI.getPosts(pageNum);
            const newPosts = data.results || [];

            if (append) {
                setPosts(prev => [...prev, ...newPosts]);
            } else {
                setPosts(newPosts);
            }
            setHasMore(data.has_next || false);
            setPage(pageNum);
            setFetchError(null);
        } catch (err) {
            console.error('Load posts error:', err);
            if (pageNum === 1) {
                setFetchError('Could not connect to server. Pull down to retry.');
                setPosts([]);
            }
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }, []);

    useEffect(() => {
        loadPosts(1);
    }, [loadPosts]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await loadPosts(1);
        setRefreshing(false);
    }, [loadPosts]);

    const loadMore = useCallback(() => {
        if (!loadingMore && hasMore) {
            loadPosts(page + 1, true);
        }
    }, [loadingMore, hasMore, page, loadPosts]);

    // Pick images
    const handlePickImages = async () => {
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permissionResult.granted) {
            Alert.alert('Permission Denied', 'Allow camera roll access to attach images.');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsMultipleSelection: true,
            selectionLimit: 4,
            quality: 0.7,
        });

        if (!result.canceled && result.assets) {
            setSelectedImages(prev => [...prev, ...result.assets.map(a => a.uri)].slice(0, 4));
        }
    };

    // Create post
    const handleCreatePost = async () => {
        if (!newContent.trim()) return;
        if (!user) {
            Alert.alert('Login Required', 'Please login to create a post.');
            return;
        }

        setCreating(true);
        try {
            await communityAPI.createPost({
                author_id: user._id || user.id,
                author_name: user.name,
                author_avatar: user.avatar_url || '',
                content: newContent.trim(),
                flair: newFlair,
                images: selectedImages, // Backend can store image URIs
            });
            setNewContent('');
            setNewFlair('general');
            setSelectedImages([]);
            setShowCreate(false);
            await loadPosts(1);
        } catch (err) {
            console.error('Create post error:', err);
            Alert.alert('Error', 'Could not create post. Check your connection and try again.');
        } finally {
            setCreating(false);
        }
    };

    // Open post detail
    const openPostDetail = async (post) => {
        setSelectedPost(post);
        setDetailLoading(true);
        setReplyingTo(null);
        setCommentText('');
        try {
            const data = await communityAPI.getPost(post.id);
            setPostDetail(data);
        } catch (err) {
            console.error('Post detail error:', err);
            Alert.alert('Error', 'Could not load post details.');
            setSelectedPost(null);
        } finally {
            setDetailLoading(false);
        }
    };

    // Like a post
    const handleLikePost = async (postId) => {
        if (!user) return;
        try {
            const userId = user._id || user.id;
            const result = await communityAPI.likePost(postId, userId);
            setPosts(prev => prev.map(p =>
                p.id === postId ? { ...p, likes_count: result.likes_count, _liked: result.action === 'liked' } : p
            ));
            if (postDetail && postDetail.id === postId) {
                setPostDetail(prev => ({ ...prev, likes_count: result.likes_count, _liked: result.action === 'liked' }));
            }
        } catch (err) {
            console.error('Like post error:', err);
        }
    };

    // Add comment
    const handleAddComment = async () => {
        if (!commentText.trim() || !user || !postDetail) return;
        setSubmittingComment(true);
        try {
            await communityAPI.addComment(postDetail.id || postDetail._id, {
                author_id: user._id || user.id,
                author_name: user.name,
                author_avatar: user.avatar_url || '',
                content: commentText.trim(),
                parent_comment_id: replyingTo ? replyingTo.id : '',
            });
            setCommentText('');
            setReplyingTo(null);
            const data = await communityAPI.getPost(postDetail.id || postDetail._id);
            setPostDetail(data);
            setPosts(prev => prev.map(p =>
                (p.id === postDetail.id || p._id === postDetail._id) ? { ...p, comments_count: data.comments_count } : p
            ));
        } catch (err) {
            const errorMsg = err.response?.data?.error || err.response?.data?.detail || err.message || 'Could not add comment.';
            Alert.alert('Error', errorMsg);
        } finally {
            setSubmittingComment(false);
        }
    };

    // Like comment
    const handleLikeComment = async (commentId) => {
        if (!user || !postDetail) return;
        try {
            const userId = user._id || user.id;
            await communityAPI.likeComment(commentId, userId);
            const data = await communityAPI.getPost(postDetail.id);
            setPostDetail(data);
        } catch (err) {
            console.error('Like comment error:', err);
        }
    };

    // --- RENDER: Post Card ---
    const renderPostCard = ({ item }) => {
        const flair = getFlairInfo(item.flair);
        const userId = user ? (user._id || user.id) : null;
        const isLiked = item._liked || (item.likes && userId && item.likes.includes(userId));

        return (
            <TouchableOpacity
                style={styles.postCard}
                onPress={() => openPostDetail(item)}
                activeOpacity={0.7}
            >
                {/* Author row */}
                <View style={styles.postHeader}>
                    <View style={styles.avatarCircle}>
                        <Text style={styles.avatarText}>
                            {(item.author_name || '?').charAt(0).toUpperCase()}
                        </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.postAuthor}>{item.author_name}</Text>
                        <Text style={styles.postTime}>{timeAgo(item.created_at)}</Text>
                    </View>
                    <View style={[styles.flairBadge, { backgroundColor: flair.color + '20' }]}>
                        <Text style={styles.flairEmoji}>{flair.icon}</Text>
                        <Text style={[styles.flairText, { color: flair.color }]}>{flair.label}</Text>
                    </View>
                </View>

                {/* Content */}
                <Text style={styles.postContent} numberOfLines={4}>{item.content}</Text>

                {/* Images */}
                {item.images && item.images.length > 0 && (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageRow}>
                        {item.images.map((uri, idx) => (
                            <Image key={idx} source={{ uri }} style={styles.postImage} />
                        ))}
                    </ScrollView>
                )}

                {/* Actions */}
                <View style={styles.postActions}>
                    <TouchableOpacity
                        style={styles.actionBtn}
                        onPress={() => handleLikePost(item.id)}
                    >
                        <Ionicons
                            name={isLiked ? 'heart' : 'heart-outline'}
                            size={20}
                            color={isLiked ? '#E91E63' : '#757575'}
                        />
                        <Text style={[styles.actionText, isLiked && { color: '#E91E63' }]}>
                            {item.likes_count || 0}
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.actionBtn} onPress={() => openPostDetail(item)}>
                        <Ionicons name="chatbubble-outline" size={18} color="#757575" />
                        <Text style={styles.actionText}>{item.comments_count || 0}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.actionBtn}>
                        <Ionicons name="share-outline" size={18} color="#757575" />
                        <Text style={styles.actionText}>Share</Text>
                    </TouchableOpacity>
                </View>
            </TouchableOpacity>
        );
    };

    // --- RENDER: Comment (supports threaded replies) ---
    const renderComment = (comment, depth = 0) => {
        return (
            <View key={comment.id} style={[styles.commentItem, { marginLeft: depth * 20 }]}>
                <View style={styles.commentHeader}>
                    <View style={[styles.avatarCircleSmall, depth > 0 && { backgroundColor: '#E3F2FD' }]}>
                        <Text style={[styles.avatarTextSmall, depth > 0 && { color: '#0288D1' }]}>
                            {(comment.author_name || '?').charAt(0).toUpperCase()}
                        </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.commentAuthor}>{comment.author_name}</Text>
                        <Text style={styles.commentTime}>{timeAgo(comment.created_at)}</Text>
                    </View>
                </View>
                <Text style={styles.commentContent}>{comment.content}</Text>
                <View style={styles.commentActions}>
                    <TouchableOpacity
                        style={styles.commentActionBtn}
                        onPress={() => handleLikeComment(comment.id)}
                    >
                        <Ionicons name="heart-outline" size={14} color="#757575" />
                        <Text style={styles.commentActionText}>{comment.likes_count || 0}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.commentActionBtn}
                        onPress={() => { setReplyingTo({ id: comment.id, name: comment.author_name }); }}
                    >
                        <Ionicons name="return-down-forward-outline" size={14} color="#0288D1" />
                        <Text style={[styles.commentActionText, { color: '#0288D1' }]}>Reply</Text>
                    </TouchableOpacity>
                </View>
                {/* Nested replies */}
                {comment.replies && comment.replies.length > 0 && (
                    comment.replies.map(reply => renderComment(reply, depth + 1))
                )}
            </View>
        );
    };

    // --- MAIN RENDER ---
    const statusBarHeight = Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0;

    return (
        <View style={[styles.container, { paddingTop: statusBarHeight }]}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>🌊 Community</Text>
                <TouchableOpacity
                    style={styles.createBtn}
                    onPress={() => {
                        if (!user) { Alert.alert('Login Required', 'Please login to post.'); return; }
                        setShowCreate(true);
                    }}
                >
                    <Ionicons name="add-circle" size={28} color="#0288D1" />
                </TouchableOpacity>
            </View>

            {/* Feed */}
            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#0288D1" />
                    <Text style={styles.loadingText}>Loading community posts...</Text>
                </View>
            ) : fetchError ? (
                /* Error state — not stuck on loading */
                <ScrollView
                    contentContainerStyle={styles.emptyContainer}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0288D1" />}
                >
                    <Ionicons name="cloud-offline-outline" size={64} color="#B0BEC5" />
                    <Text style={styles.emptyTitle}>Connection Error</Text>
                    <Text style={styles.emptySubtitle}>{fetchError}</Text>
                </ScrollView>
            ) : (
                <FlatList
                    data={posts}
                    keyExtractor={(item, idx) => item.id || String(idx)}
                    renderItem={renderPostCard}
                    contentContainerStyle={styles.feedContent}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0288D1" />
                    }
                    onEndReached={loadMore}
                    onEndReachedThreshold={0.3}
                    ListFooterComponent={loadingMore ? <ActivityIndicator size="small" color="#0288D1" style={{ padding: 15 }} /> : null}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="chatbubbles-outline" size={64} color="#B0BEC5" />
                            <Text style={styles.emptyTitle}>No posts yet</Text>
                            <Text style={styles.emptySubtitle}>Be the first to share something with the community!</Text>
                            <TouchableOpacity
                                style={styles.emptyCreateBtn}
                                onPress={() => {
                                    if (!user) { Alert.alert('Login Required'); return; }
                                    setShowCreate(true);
                                }}
                            >
                                <Text style={styles.emptyCreateText}>Create Post</Text>
                            </TouchableOpacity>
                        </View>
                    }
                />
            )}

            {/* =================== CREATE POST MODAL =================== */}
            <Modal visible={showCreate} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                        style={styles.modalContainer}
                    >
                        <ScrollView style={styles.modalContent} keyboardShouldPersistTaps="handled">
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>Create Post</Text>
                                <TouchableOpacity onPress={() => { setShowCreate(false); setCreating(false); }}>
                                    <Ionicons name="close" size={26} color="#757575" />
                                </TouchableOpacity>
                            </View>

                            {/* Flair picker */}
                            <Text style={styles.flairPickerLabel}>Select a flair:</Text>
                            <View style={styles.flairGrid}>
                                {FLAIR_OPTIONS.map(f => (
                                    <TouchableOpacity
                                        key={f.key}
                                        style={[
                                            styles.flairOption,
                                            newFlair === f.key && { backgroundColor: f.color + '30', borderColor: f.color },
                                        ]}
                                        onPress={() => setNewFlair(f.key)}
                                    >
                                        <Text style={styles.flairOptionEmoji}>{f.icon}</Text>
                                        <Text style={[styles.flairOptionText, newFlair === f.key && { color: f.color, fontWeight: '700' }]}>
                                            {f.label}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            {/* Content input */}
                            <TextInput
                                style={styles.postInput}
                                placeholder="What's on your mind? Share beach tips, events, or questions..."
                                placeholderTextColor="#9E9E9E"
                                multiline
                                value={newContent}
                                onChangeText={setNewContent}
                                maxLength={2000}
                            />
                            <Text style={styles.charCount}>{newContent.length}/2000</Text>

                            {/* Image picker */}
                            <TouchableOpacity style={styles.imagePickerBtn} onPress={handlePickImages}>
                                <Ionicons name="images-outline" size={20} color="#0288D1" />
                                <Text style={styles.imagePickerText}>
                                    {selectedImages.length > 0 ? `${selectedImages.length} image(s) selected` : 'Add Images (up to 4)'}
                                </Text>
                            </TouchableOpacity>

                            {selectedImages.length > 0 && (
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imagePreviewRow}>
                                    {selectedImages.map((uri, idx) => (
                                        <View key={idx} style={styles.imagePreviewContainer}>
                                            <Image source={{ uri }} style={styles.imagePreview} />
                                            <TouchableOpacity
                                                style={styles.imageRemoveBtn}
                                                onPress={() => setSelectedImages(prev => prev.filter((_, i) => i !== idx))}
                                            >
                                                <Ionicons name="close-circle" size={22} color="#F44336" />
                                            </TouchableOpacity>
                                        </View>
                                    ))}
                                </ScrollView>
                            )}

                            <TouchableOpacity
                                style={[styles.submitBtn, (!newContent.trim() || creating) && styles.submitBtnDisabled]}
                                onPress={handleCreatePost}
                                disabled={!newContent.trim() || creating}
                            >
                                {creating ? (
                                    <ActivityIndicator size="small" color="#fff" />
                                ) : (
                                    <Text style={styles.submitBtnText}>Post to Community</Text>
                                )}
                            </TouchableOpacity>

                            <View style={{ height: 30 }} />
                        </ScrollView>
                    </KeyboardAvoidingView>
                </View>
            </Modal>

            {/* =================== POST DETAIL MODAL =================== */}
            <Modal visible={!!selectedPost} animationType="slide" transparent={false}>
                <View style={[styles.detailContainer, { paddingTop: statusBarHeight }]}>
                    {/* Detail Header */}
                    <View style={styles.detailHeader}>
                        <TouchableOpacity onPress={() => { setSelectedPost(null); setPostDetail(null); }}>
                            <Ionicons name="arrow-back" size={24} color="#01579B" />
                        </TouchableOpacity>
                        <Text style={styles.detailHeaderTitle}>Post</Text>
                        <View style={{ width: 24 }} />
                    </View>

                    {detailLoading ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color="#0288D1" />
                        </View>
                    ) : postDetail ? (
                        <KeyboardAvoidingView
                            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                            style={{ flex: 1 }}
                            keyboardVerticalOffset={90}
                        >
                            <ScrollView style={styles.detailScroll} contentContainerStyle={{ paddingBottom: 100 }}>
                                {/* Post */}
                                <View style={styles.detailPostCard}>
                                    <View style={styles.postHeader}>
                                        <View style={styles.avatarCircle}>
                                            <Text style={styles.avatarText}>
                                                {(postDetail.author_name || '?').charAt(0).toUpperCase()}
                                            </Text>
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.postAuthor}>{postDetail.author_name}</Text>
                                            <Text style={styles.postTime}>{timeAgo(postDetail.created_at)}</Text>
                                        </View>
                                        {(() => { const fl = getFlairInfo(postDetail.flair); return (
                                            <View style={[styles.flairBadge, { backgroundColor: fl.color + '20' }]}>
                                                <Text style={styles.flairEmoji}>{fl.icon}</Text>
                                                <Text style={[styles.flairText, { color: fl.color }]}>{fl.label}</Text>
                                            </View>
                                        ); })()}
                                    </View>
                                    <Text style={styles.detailContent}>{postDetail.content}</Text>

                                    {/* Detail images */}
                                    {postDetail.images && postDetail.images.length > 0 && (
                                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageRow}>
                                            {postDetail.images.map((uri, idx) => (
                                                <Image key={idx} source={{ uri }} style={styles.detailImage} />
                                            ))}
                                        </ScrollView>
                                    )}

                                    <View style={styles.postActions}>
                                        <TouchableOpacity style={styles.actionBtn} onPress={() => handleLikePost(postDetail.id)}>
                                            <Ionicons name="heart-outline" size={20} color="#757575" />
                                            <Text style={styles.actionText}>{postDetail.likes_count || 0}</Text>
                                        </TouchableOpacity>
                                        <View style={styles.actionBtn}>
                                            <Ionicons name="chatbubble-outline" size={18} color="#757575" />
                                            <Text style={styles.actionText}>{postDetail.comments_count || 0} comments</Text>
                                        </View>
                                    </View>
                                </View>

                                {/* Comments */}
                                <Text style={styles.commentsTitle}>Comments</Text>
                                {postDetail.comments && postDetail.comments.length > 0 ? (
                                    postDetail.comments.map(comment => renderComment(comment, 0))
                                ) : (
                                    <Text style={styles.noComments}>No comments yet. Be the first!</Text>
                                )}
                            </ScrollView>

                            {/* Comment input */}
                            <View style={styles.commentInputContainer}>
                                {replyingTo && (
                                    <View style={styles.replyingToBar}>
                                        <Text style={styles.replyingToText}>Replying to {replyingTo.name}</Text>
                                        <TouchableOpacity onPress={() => setReplyingTo(null)}>
                                            <Ionicons name="close-circle" size={18} color="#757575" />
                                        </TouchableOpacity>
                                    </View>
                                )}
                                <View style={styles.commentInputRow}>
                                    <TextInput
                                        style={styles.commentInput}
                                        placeholder={replyingTo ? `Reply to ${replyingTo.name}...` : "Write a comment..."}
                                        placeholderTextColor="#9E9E9E"
                                        value={commentText}
                                        onChangeText={setCommentText}
                                        multiline
                                    />
                                    <TouchableOpacity
                                        style={[styles.sendBtn, (!commentText.trim() || submittingComment) && { opacity: 0.4 }]}
                                        onPress={handleAddComment}
                                        disabled={!commentText.trim() || submittingComment}
                                    >
                                        {submittingComment ? (
                                            <ActivityIndicator size="small" color="#fff" />
                                        ) : (
                                            <Ionicons name="send" size={18} color="#fff" />
                                        )}
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </KeyboardAvoidingView>
                    ) : null}
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F0F4F8',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 15,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#01579B',
    },
    createBtn: {
        padding: 4,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 12,
        color: '#757575',
        fontSize: 14,
    },
    feedContent: {
        paddingHorizontal: 15,
        paddingTop: 10,
        paddingBottom: 90,
    },

    // Post Card
    postCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 3,
    },
    postHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    avatarCircle: {
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: '#0288D1',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    avatarText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    postAuthor: {
        fontSize: 15,
        fontWeight: '700',
        color: '#212121',
    },
    postTime: {
        fontSize: 12,
        color: '#9E9E9E',
        marginTop: 1,
    },
    flairBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    flairEmoji: {
        fontSize: 12,
        marginRight: 4,
    },
    flairText: {
        fontSize: 11,
        fontWeight: '600',
    },
    postContent: {
        fontSize: 15,
        color: '#333',
        lineHeight: 22,
        marginBottom: 12,
    },
    imageRow: {
        marginBottom: 12,
    },
    postImage: {
        width: 160,
        height: 120,
        borderRadius: 12,
        marginRight: 8,
        backgroundColor: '#E0E0E0',
    },
    postActions: {
        flexDirection: 'row',
        borderTopWidth: 1,
        borderTopColor: '#F0F0F0',
        paddingTop: 10,
        gap: 20,
    },
    actionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
    },
    actionText: {
        fontSize: 13,
        color: '#757575',
        fontWeight: '500',
    },

    // Empty state
    emptyContainer: {
        alignItems: 'center',
        paddingTop: 80,
        paddingHorizontal: 40,
        flexGrow: 1,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#455A64',
        marginTop: 16,
    },
    emptySubtitle: {
        fontSize: 14,
        color: '#78909C',
        textAlign: 'center',
        marginTop: 8,
        lineHeight: 20,
    },
    emptyCreateBtn: {
        marginTop: 24,
        backgroundColor: '#0288D1',
        paddingHorizontal: 28,
        paddingVertical: 12,
        borderRadius: 25,
    },
    emptyCreateText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 15,
    },

    // Create Post Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContainer: {
        flex: 0,
        maxHeight: '90%',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 20,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#01579B',
    },
    flairPickerLabel: {
        fontSize: 14,
        color: '#455A64',
        marginBottom: 10,
        fontWeight: '700',
    },
    flairGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 16,
    },
    flairOption: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1.5,
        borderColor: '#E0E0E0',
        backgroundColor: '#FAFAFA',
    },
    flairOptionEmoji: {
        fontSize: 14,
        marginRight: 5,
    },
    flairOptionText: {
        fontSize: 12,
        color: '#616161',
        fontWeight: '500',
    },
    postInput: {
        backgroundColor: '#F5F7FA',
        borderRadius: 14,
        padding: 16,
        fontSize: 15,
        color: '#333',
        minHeight: 120,
        textAlignVertical: 'top',
        borderWidth: 1,
        borderColor: '#E0E0E0',
        marginBottom: 8,
    },
    charCount: {
        textAlign: 'right',
        color: '#9E9E9E',
        fontSize: 12,
        marginBottom: 12,
    },
    imagePickerBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingVertical: 12,
        paddingHorizontal: 16,
        backgroundColor: '#E3F2FD',
        borderRadius: 12,
        marginBottom: 12,
    },
    imagePickerText: {
        color: '#0288D1',
        fontWeight: '600',
        fontSize: 14,
    },
    imagePreviewRow: {
        marginBottom: 16,
    },
    imagePreviewContainer: {
        position: 'relative',
        marginRight: 10,
    },
    imagePreview: {
        width: 80,
        height: 80,
        borderRadius: 10,
        backgroundColor: '#E0E0E0',
    },
    imageRemoveBtn: {
        position: 'absolute',
        top: -6,
        right: -6,
        backgroundColor: '#fff',
        borderRadius: 12,
    },
    submitBtn: {
        backgroundColor: '#0288D1',
        borderRadius: 14,
        paddingVertical: 14,
        alignItems: 'center',
    },
    submitBtnDisabled: {
        backgroundColor: '#B0BEC5',
    },
    submitBtnText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },

    // Post Detail Modal
    detailContainer: {
        flex: 1,
        backgroundColor: '#F0F4F8',
    },
    detailHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 14,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    detailHeaderTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#01579B',
    },
    detailScroll: {
        flex: 1,
    },
    detailPostCard: {
        backgroundColor: '#fff',
        padding: 18,
        marginBottom: 8,
    },
    detailContent: {
        fontSize: 16,
        color: '#212121',
        lineHeight: 24,
        marginBottom: 14,
    },
    detailImage: {
        width: 240,
        height: 180,
        borderRadius: 12,
        marginRight: 10,
        backgroundColor: '#E0E0E0',
    },
    commentsTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#01579B',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },

    // Comment
    commentItem: {
        backgroundColor: '#fff',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 0.5,
        borderBottomColor: '#F0F0F0',
    },
    commentHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
    },
    avatarCircleSmall: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: '#0288D1',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    avatarTextSmall: {
        color: '#fff',
        fontSize: 13,
        fontWeight: 'bold',
    },
    commentAuthor: {
        fontSize: 13,
        fontWeight: '700',
        color: '#333',
    },
    commentTime: {
        fontSize: 11,
        color: '#9E9E9E',
    },
    commentContent: {
        fontSize: 14,
        color: '#424242',
        lineHeight: 20,
        marginLeft: 40,
    },
    commentActions: {
        flexDirection: 'row',
        marginLeft: 40,
        marginTop: 6,
        gap: 16,
    },
    commentActionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    commentActionText: {
        fontSize: 12,
        color: '#757575',
    },
    noComments: {
        textAlign: 'center',
        color: '#9E9E9E',
        padding: 30,
        fontSize: 14,
    },

    // Comment Input
    commentInputContainer: {
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#E0E0E0',
        paddingHorizontal: 12,
        paddingVertical: 8,
    },
    replyingToBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#E3F2FD',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        marginBottom: 6,
    },
    replyingToText: {
        fontSize: 12,
        color: '#0288D1',
        fontWeight: '600',
    },
    commentInputRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: 8,
    },
    commentInput: {
        flex: 1,
        backgroundColor: '#F5F7FA',
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 10,
        fontSize: 14,
        maxHeight: 80,
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    sendBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#0288D1',
        justifyContent: 'center',
        alignItems: 'center',
    },
});
