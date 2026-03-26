import connectDB from '@/lib/db/mongodb';
import User from '@/models/User';
import { auth } from '@/lib/auth';

export async function PUT(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, phone, image, location } = await request.json();

    if (!name || name.trim().length === 0) {
      return Response.json({ error: 'Name is required' }, { status: 400 });
    }

    await connectDB();

    const updateData: any = {
      name: name.trim(),
      phone: phone?.trim() || '',
    };

    if (image) updateData.image = image;

    // Update location if provided with valid coordinates
    if (
      location &&
      Array.isArray(location.coordinates) &&
      location.coordinates.length === 2 &&
      typeof location.coordinates[0] === 'number' &&
      typeof location.coordinates[1] === 'number'
    ) {
      updateData.location = {
        type: 'Point',
        coordinates: location.coordinates,
        address: location.address ?? '',
      };
    }

    const user = await User.findOneAndUpdate(
      { email: session.user.email },
      updateData,
      { new: true }
    );

    if (!user) {
      return Response.json({ error: 'User not found' }, { status: 404 });
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
        location: user.location,
      },
    });
  } catch (error) {
    console.error('Profile update error:', error);
    return Response.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}

// GET /api/user/profile — return current user's location (for client-side checks)
export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const user = await User.findOne({ email: session.user.email }).select('location role');
    if (!user) return Response.json({ error: 'User not found' }, { status: 404 });

    return Response.json({ location: user.location, role: user.role });
  } catch (error) {
    return Response.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
}
