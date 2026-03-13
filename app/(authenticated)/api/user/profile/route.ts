import  connectDB from '@/lib/db/mongodb';
import User from '@/models/User';
import { auth } from '@/lib/auth';
export async function PUT(request: Request) {
  try {
    // Check authentication
    const session = await auth();
 

    if (!session?.user?.email) {
      return Response.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { name, phone, image } = await request.json();

    // Validate input
    if (!name || name.trim().length === 0) {
      return Response.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    await connectDB();

    const updateData: any = {
      name: name.trim(),
      phone: phone?.trim() || '',
    };

    // Only update image if provided
    if (image) {
      updateData.image = image;
    }

    const user = await User.findOneAndUpdate(
      { email: session.user.email },
      updateData,
      { new: true }
    );

    if (!user) {
      return Response.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return Response.json({
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        image: user.image,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Profile update error:', error);
    return Response.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}
